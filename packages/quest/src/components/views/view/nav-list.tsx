'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  compactRowDisplayTitle,
  questTaskIconRefs,
} from '@terrafirmagreg-team/quest/lib/display';
import { questFromCompact } from '@terrafirmagreg-team/quest/lib/data/parse';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import type { QuestCompactRow } from '@terrafirmagreg-team/quest/lib/data/dto';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function NavList({
  rows,
  dataset,
  lang,
  langMap,
  empty,
  version,
}: {
  rows: QuestCompactRow[];
  dataset: DatasetRef;
  lang: Lang;
  langMap: Record<string, string>;
  version?: string;
  empty: string;
}) {
  if (!rows.length) {
    return <p className="text-xs text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {rows.map((row) => {
        const icon = questTaskIconRefs(questFromCompact(row))[0];
        return (
          <ItemRow
            key={row.id}
            href={questHref(dataset, lang, {
              category: row.filename,
              id: row.id,
              version,
            })}
            size="xs"
            className="px-1.5 py-1"
            media={
              icon ? (
                <Entry
                  reference={icon}
                  name={compactRowDisplayTitle(row, langMap)}
                  size="lg"
                  href={false}
                  tooltip={false}
                  missing="placeholder"
                />
              ) : null
            }
            title={compactRowDisplayTitle(row, langMap)}
            titleClassName="font-normal truncate"
          />
        );
      })}
    </div>
  );
}

