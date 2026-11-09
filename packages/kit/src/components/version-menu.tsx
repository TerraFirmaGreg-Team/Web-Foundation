'use client';

import { CheckIcon, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useEffect, useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/dropdown-menu';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { type DatasetRef, sectionUrl } from '@terrafirmagreg-team/sites/location';
import { clientDumpLoader } from '@terrafirmagreg-team/kit/lib/config';

import type { SectionKey } from '@terrafirmagreg-team/kit/types';

export function VersionMenu({
  section,
  datasetId,
  currentRef,
  label,
  versions,
  onSelect,
}: {
  section?: SectionKey;
  datasetId: string;

  currentRef: DatasetRef;

  label?: string;
  versions: { versions: string[]; latest?: string } | null | undefined;

  onSelect?: (version: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const pinned = currentRef.version;
  const shown = label ?? pinned;
  const text = shown ? `v${shown}` : datasetId;
  if (!versions || versions.versions.length < 2 || (!section && !onSelect)) {
    return <>{text}</>;
  }
  const ordered = [...versions.versions].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );
  if (versions.latest) {
    const i = ordered.indexOf(versions.latest);
    if (i > 0) ordered.unshift(ordered.splice(i, 1)[0]);
  }
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger className="-mx-1.5 inline-flex h-8 items-center gap-0.5 rounded-lg px-1.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        {text}
        <ChevronDown className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="max-h-36 min-w-32"
      >
        <VersionMenuItems
          ordered={ordered}
          latest={versions.latest}
          datasetId={datasetId}
          currentRef={currentRef}
          section={section}
          onSelect={onSelect}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function VersionMenuItems({
  ordered,
  latest,
  datasetId,
  currentRef,
  section,
  onSelect,
}: {
  ordered: string[];
  latest: string | undefined;
  datasetId: string;
  currentRef: DatasetRef;
  section?: SectionKey;
  onSelect?: (version: string | undefined) => void;
}) {
  const { Link } = useUiComponents();
  const t = useTranslations();
  const router = useRouter();

  const current = useLocationSearchParams();
  const hrefs = useMemo(
    () =>
      ordered.map((version) => {
        const params = new URLSearchParams(current);
        if (version === latest) params.delete('version');
        else params.set('version', version);
        const q = params.toString();
        return section
          ? `${sectionUrl(section, datasetId)}${q ? `?${q}` : ''}`
          : undefined;
      }),
    [ordered, current, latest, section, datasetId],
  );
  useEffect(() => {
    if (!section) return;
    for (const href of hrefs) {
      if (href) router.prefetch(href);
    }
  }, [hrefs, section, router]);
  return ordered.map((version, index) => {
    const isLatest = version === latest;
    const selected = currentRef.id === datasetId &&
      currentRef.version === (isLatest ? undefined : version);
    const href = hrefs[index];
    return (
      <DropdownMenuItem
        key={version}
        closeOnClick
        render={
          section && href ? <Link href={href} /> : undefined
        }
        onClick={
          onSelect ? () => onSelect(isLatest ? undefined : version) : undefined
        }
        onPointerEnter={() =>
          clientDumpLoader().warm?.(
            isLatest ? { id: datasetId } : { id: datasetId, version },
          )
        }
        className="gap-2 px-2.5 py-1.5 text-xs"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">v{version}</span>
          {isLatest && (
            <span className="text-2xs text-muted-foreground">
              {t('latest', { note: 'ui.version_latest' })}
            </span>
          )}
        </span>
        {selected && <CheckIcon className="size-3.5 text-primary" />}
      </DropdownMenuItem>
    );
  });
}

