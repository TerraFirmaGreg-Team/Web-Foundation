'use client';

import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { useEntryContext } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import { ResolvedLangContext } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { loadQuestCompactIndex } from '@terrafirmagreg-team/quest/lib/client/quest';
import type { QuestCompactRow } from '@terrafirmagreg-team/quest/lib/data/dto';
import type { QuestDirectiveProps } from '@terrafirmagreg-team/game/types/entry';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

function slug(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findQuest(
  index: { quests: QuestCompactRow[] } | undefined,
  id: string,
): QuestCompactRow | undefined {
  const needle = id.trim();
  return index?.quests.find(
    (row) =>
      row.id === needle ||
      row.filename === needle ||
      slug(row.title) === slug(needle),
  );
}

export function QuestEntry({
  id,
  dataset: datasetProp,
  name,
  filename,
  ...rest
}: QuestDirectiveProps) {
  const ctx = useEntryContext();
  const pathname = usePathname();
  const locId = parseSectionLocation(pathname).dataset;
  const dataset =
    datasetProp ?? ctx?.dataset ?? (locId ? { id: locId } : undefined);
  const lang = useContext(ResolvedLangContext)?.lang;
  const index = useAsyncValue(
    dataset && lang && id
      ? () => loadQuestCompactIndex(dataset, lang)
      : false,
    [dataset, lang, id],
  );
  const row = findQuest(index, id ?? '');
  const icon: TaggedReference | undefined =
    row?.icon && row.iconKind
      ? { kind: row.iconKind, id: row.icon }
      : undefined;
  return (
    <Entry
      kind="quest"
      id={row?.id ?? id}
      dataset={dataset}
      name={name ?? row?.title}
      icon={icon}
      filename={filename ?? row?.filename}
      {...rest}
    />
  );
}

