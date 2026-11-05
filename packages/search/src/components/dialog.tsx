'use client';
import {
  SearchDialog as SearchDialogRoot,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  SearchDialogListItem,
  type SharedProps,
} from '@terrafirmagreg-team/ui/components/blocks/search/dialog';
import {
  useDocsSearch,
  type SearchClient,
} from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { usePathname } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/dropdown-menu';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useSectionCatalog } from '@terrafirmagreg-team/kit/hooks/use-catalog';
import { useSectionNames } from '@terrafirmagreg-team/kit/hooks/use-section-names';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';
import { searchHitFilter, mergeClients } from '../lib';
import { getSearchClientSources } from '../lib/sources';

const chip =
  'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer';
const chipOn = 'bg-accent text-accent-foreground border-transparent';
const chipOff = 'text-muted-foreground hover:text-foreground';

type ScopeSel = { secs: Set<string>; dss: Set<string> };
const EMPTY_SEL: ScopeSel = { secs: new Set(), dss: new Set() };

function toggled(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function ScopeDropdown({
  label,
  allLabel,
  items,
  picked,
  onToggle,
  onAll,
}: {
  label: string;
  allLabel: string;
  items: { id: string; title: string }[];
  picked: Set<string>;
  onToggle: (id: string) => void;
  onAll: () => void;
}) {
  const active = picked.size > 0;
  const text =
    picked.size === 0
      ? label
      : picked.size === 1
        ? (items.find((item) => picked.has(item.id))?.title ??
          [...picked][0])
        : `${label}: ${picked.size}`;
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-pressed={active}
        className={cn(
          chip,
          'inline-flex items-center gap-1',
          active ? chipOn : chipOff,
        )}
      >
        {text}
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="max-h-64 min-w-40">
        <DropdownMenuItem
          onClick={onAll}
          className="gap-2 px-2.5 py-1.5 text-xs font-medium"
        >
          {allLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {items.map(({ id, title }) => (
          <DropdownMenuCheckboxItem
            key={id}
            checked={!active || picked.has(id)}
            onCheckedChange={() => onToggle(id)}
            closeOnClick={false}
            className="text-xs"
          >
            {title}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SearchDialog(props: SharedProps & { api: string }) {
  const locale = useResolvedLang();
  const t = useTranslations();
  const sectionNames = useSectionNames();
  const catalog = useSectionCatalog();
  const pathname = usePathname();
  const version = useLocationSearchParams().get('version') ?? undefined;
  const { section, dataset: locationDataset } =
    parseSectionLocation(pathname);
  const dataset = locationDataset;
  const scopeKey = `${section ?? ''}/${locationDataset ?? ''}`;

  const sections = useMemo(
    () =>
      Object.entries(catalog).filter(
        ([, datasets]) => datasets.length > 0,
      ),
    [catalog],
  );
  const defaultSel = useMemo((): ScopeSel => {
    if (section && dataset)
      return { secs: new Set([section]), dss: new Set([dataset]) };
    if (section) return { secs: new Set([section]), dss: new Set() };
    return { secs: new Set(), dss: new Set() };
  }, [section, dataset]);
  const [picked, setPicked] = useState<{ key: string; sel: ScopeSel }>();
  const sel = picked?.key === scopeKey ? picked.sel : defaultSel;
  const setSel = (value: ScopeSel) =>
    setPicked({ key: scopeKey, sel: value });
  const everywhere = sel.secs.size === 0 && sel.dss.size === 0;
  const scopePairs = useMemo(() => {
    const out = new Set<string>();
    for (const [sec, datasets] of sections) {
      if (sel.secs.size && !sel.secs.has(sec)) continue;
      for (const { id } of datasets) {
        if (sel.dss.size && !sel.dss.has(id)) continue;
        out.add(`${sec}:${id}`);
      }
    }
    return out;
  }, [sections, sel]);
  const datasetOptions = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const [sec, datasets] of sections) {
      if (sel.secs.size && !sel.secs.has(sec)) continue;
      for (const { id, title } of datasets) {
        if (!map.has(id)) map.set(id, title);
      }
    }
    return [...map.entries()].map(([id, title]) => ({ id, title }));
  }, [sections, sel.secs]);

  const client = useMemo((): SearchClient => {
    const from = `${props.api}/${locale}.json`;
    const content = staticClient({ locale, from });
    const refsById = new Map<string, { id: string; version?: string }>();
    for (const entry of scopePairs) {
      const [sec, id] = entry.split(':');
      if (!refsById.has(id)) {
        refsById.set(
          id,
          sec === section && id === dataset && locationDataset
            ? { id, version }
            : { id },
        );
      }
    }
    const extra = getSearchClientSources().map((make) =>
      make({ refs: [...refsById.values()], locale, tag: undefined }),
    );
    return mergeClients(content, ...extra);
  }, [locale, scopePairs, section, dataset, locationDataset, version, props.api]);
  const { search, setSearch, query } = useDocsSearch({ client });
  const showBadges =
    everywhere ||
    new Set([...scopePairs].map((entry) => entry.split(':')[0]!)).size > 1;
  const items = useMemo(() => {
    const list = query.data !== 'empty' ? (query.data ?? []) : [];
    const inScope = (item: (typeof list)[number]) =>
      everywhere ||
      !('url' in item) ||
      [...scopePairs].some((entry) =>
        item.url.startsWith(`/${entry.replace(':', '/')}`),
      );
    const hitFilter =
      section && typeof window !== 'undefined'
        ? searchHitFilter(
            section,
            new URLSearchParams(window.location.search),
          )
        : undefined;
    return list.filter(
      (item) => inScope(item) && (hitFilter?.(item) ?? true),
    );
  }, [query.data, section, everywhere, scopePairs]);

  return (
    <SearchDialogRoot search={search} onSearchChange={setSearch} isLoading={query.isLoading} {...props}>
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        {query.isLoading ? (
          <div className="flex flex-col gap-1.5 p-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-5/6" />
            <Skeleton className="h-9 w-4/6" />
          </div>
        ) : (
          <SearchDialogList
            items={items.length ? items : null}
            Item={(itemProps) => (
              <SearchDialogListItem
                {...itemProps}
                badge={
                  showBadges && 'url' in itemProps.item
                    ? scopeBadge(itemProps.item.url)
                    : undefined
                }
              />
            )}
          />
        )}
        <SearchDialogFooter>
          <div className="flex flex-wrap items-center gap-1">
            <ScopeDropdown
              label={t('Sections', { note: 'ui.search_sections' })}
              allLabel={t('All', { note: 'ui.search_all' })}
              items={sections.map(([sec]) => ({
                id: sec,
                title: sectionNames[sec]?.title ?? sec,
              }))}
              picked={sel.secs}
              onToggle={(id) =>
                setSel({ ...sel, secs: toggled(sel.secs, id) })
              }
              onAll={() => setSel({ ...sel, secs: new Set() })}
            />
            <ScopeDropdown
              label={t('Datasets', { note: 'ui.search_datasets' })}
              allLabel={t('All', { note: 'ui.search_all' })}
              items={datasetOptions.map(({ id, title }) => ({
                id,
                title: title ?? id,
              }))}
              picked={sel.dss}
              onToggle={(id) =>
                setSel({ ...sel, dss: toggled(sel.dss, id) })
              }
              onAll={() => setSel({ ...sel, dss: new Set() })}
            />
            <button
              type="button"
              aria-pressed={everywhere}
              className={cn(chip, everywhere ? chipOn : chipOff)}
              onClick={() => setSel(EMPTY_SEL)}
            >
              {t('Everywhere', { note: 'ui.search_everywhere' })}
            </button>
          </div>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialogRoot>
  );

  function scopeBadge(url: string) {
    const sec = url.split('/')[1];
    return sec && sec in catalog ? (sectionNames[sec]?.title ?? sec) : undefined;
  }
}

