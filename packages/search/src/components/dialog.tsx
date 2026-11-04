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
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useSectionCatalog } from '@terrafirmagreg-team/kit/hooks/use-catalog';
import { useSectionNames } from '@terrafirmagreg-team/kit/hooks/use-section-names';
import {
  dumpSectionKeys,
  parseSectionLocation,
} from '@terrafirmagreg-team/sites/location';
import { searchHitFilter, mergeClients } from '../lib';
import { getSearchClientSources } from '../lib/sources';

const chip =
  'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer';
const chipOn = 'bg-accent text-accent-foreground border-transparent';
const chipOff = 'text-muted-foreground hover:text-foreground';
const chipMixed = cn(chipOff, 'border-dashed');

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
  const defaultSel = useMemo((): Set<string> => {
    if (section && dataset) return new Set([`${section}:${dataset}`]);
    if (section)
      return new Set(
        (catalog[section] ?? []).map(({ id }) => `${section}:${id}`),
      );
    return new Set();
  }, [section, dataset, catalog]);
  const [picked, setPicked] = useState<{ key: string; sel: Set<string> }>();
  const sel = picked?.key === scopeKey ? picked.sel : defaultSel;
  const setSel = (value: Set<string>) =>
    setPicked({ key: scopeKey, sel: value });
  const toggle = (ids: readonly string[]) => {
    const next = new Set(sel);
    const allOn = ids.every((id) => next.has(id));
    for (const id of ids) {
      if (allOn) next.delete(id);
      else next.add(id);
    }
    setSel(next);
  };

  const client = useMemo((): SearchClient => {
    const from = `${props.api}/${locale}.json`;
    const content = staticClient({ locale, from });
    const selSecs = new Set([...sel].map((entry) => entry.split(':')[0]!));
    const scopedSections =
      sel.size === 0
        ? dumpSectionKeys()
        : dumpSectionKeys().filter((sec) => selSecs.has(sec));
    const refs = scopedSections.flatMap((sec) =>
      (catalog[sec] ?? []).map(({ id }) =>
        sec === section && id === dataset && locationDataset
          ? { id, version }
          : { id },
      ),
    );
    const extra = getSearchClientSources().map((make) =>
      make({ refs, locale, tag: undefined }),
    );
    return mergeClients(content, ...extra);
  }, [locale, sel, section, dataset, locationDataset, version, catalog, props.api]);
  const { search, setSearch, query } = useDocsSearch({ client });
  const showBadges =
    sel.size === 0 ||
    new Set([...sel].map((entry) => entry.split(':')[0]!)).size > 1;
  const items = useMemo(() => {
    const list = query.data !== 'empty' ? (query.data ?? []) : [];
    const inScope = (item: (typeof list)[number]) =>
      sel.size === 0 ||
      !('url' in item) ||
      [...sel].some((entry) =>
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
  }, [query.data, section, sel]);

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
            <button
              type="button"
              aria-pressed={sel.size === 0}
              className={cn(chip, sel.size === 0 ? chipOn : chipOff)}
              onClick={() => setSel(new Set())}
            >
              {t('Everywhere', { note: 'ui.search_everywhere' })}
            </button>
            <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
            {sections.map(([sec, datasets]) => {
              const ids = datasets.map(({ id }) => `${sec}:${id}`);
              if (ids.length === 1) {
                const id = ids[0]!;
                const on = sel.has(id);
                return (
                  <button
                    key={sec}
                    type="button"
                    aria-pressed={on}
                    className={cn(chip, on ? chipOn : chipOff)}
                    onClick={() => toggle(ids)}
                  >
                    {sectionNames[sec]?.title ?? sec}
                  </button>
                );
              }
              const onCount = ids.filter((id) => sel.has(id)).length;
              return [
                <button
                  key={sec}
                  type="button"
                  aria-pressed={onCount > 0}
                  className={cn(
                    chip,
                    onCount === ids.length
                      ? chipOn
                      : onCount > 0
                        ? chipMixed
                        : chipOff,
                  )}
                  onClick={() => toggle(ids)}
                >
                  {sectionNames[sec]?.title ?? sec}
                </button>,
                ...datasets.map(({ id, title }) => {
                  const entry = `${sec}:${id}`;
                  const on = sel.has(entry);
                  return (
                    <button
                      key={entry}
                      type="button"
                      aria-pressed={on}
                      className={cn(chip, on ? chipOn : chipOff)}
                      onClick={() => toggle([entry])}
                    >
                      {title ?? id}
                    </button>
                  );
                }),
              ];
            })}
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

