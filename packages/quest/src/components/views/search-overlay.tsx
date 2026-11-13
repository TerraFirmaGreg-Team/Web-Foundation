'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useMemo } from 'react';
import { pushUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { CommandSearch } from '@terrafirmagreg-team/ui/components/blocks/search/command';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import {
  compactRowDisplayTitle,
  questTaskIconRefs,
} from '@terrafirmagreg-team/quest/lib/display';
import { questFromCompact } from '@terrafirmagreg-team/quest/lib/data/parse';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import type {
  QuestCompactIndex,
  QuestCompactRow,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import { filterCompactQuests } from '@terrafirmagreg-team/quest/lib/search/overlay';

export function SearchOverlay({
  open,
  query,
  onQuery,
  onClose,
  dataset,
  langMap,
  index,
  version,
}: {
  open: boolean;
  query: string;
  onQuery: (value: string) => void;
  onClose: () => void;
  dataset: DatasetRef;
  langMap: Record<string, string>;
  index: QuestCompactIndex | null;
  version?: string;
}) {
  const t = useTranslations();
  const resolved = useResolvedLang();
  const results = useMemo(
    () => (index ? filterCompactQuests(index, query) : []),
    [index, query],
  );

  return (
    <CommandSearch<QuestCompactRow>
      open={open}
      onClose={onClose}
      query={query}
      onQuery={onQuery}
      title={t('Search quests', { note: 'quest.search' })}
      placeholder={t('Search quests', { note: 'quest.search' })}
      emptyLabel={t('No quests in this chapter.', { note: 'quest.empty' })}
      items={results.map((row) => {
        const icon =
          (row.icon
            ? { id: row.icon, kind: row.iconKind }
            : questTaskIconRefs(questFromCompact(row))[0]) ?? null;
        return {
          id: row.id,
          data: row,
          icon: icon ? (
            <Entry
              id={icon.id}
              kind={icon.kind}
              name={compactRowDisplayTitle(row, langMap)}
              size="lg"
              href={false}
              tooltip={false}
              missing="hide"
            />
          ) : undefined,
        label: compactRowDisplayTitle(row, langMap),
        meta:
          langString(
            langMap,
            index?.chapters.find(
              (chapter) => chapter.filename === row.filename,
            )?.title,
          ) ?? row.filename,
        };
      })}
      onPick={(item) => {
        const row = item.data;
        if (!row) return;
        pushUrlState(
          questHref(dataset, resolved, {
            category: row.filename,
            id: row.id,
            version,
          }),
        );
      }}
    />
  );
}

