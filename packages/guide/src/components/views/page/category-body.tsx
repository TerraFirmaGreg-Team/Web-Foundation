import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { guideBookHref } from '@terrafirmagreg-team/guide/lib/paths';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/messages';
import type { GuideIndex, GuideMessages } from '@terrafirmagreg-team/guide/types';

type GuideCategoryBodyProps = {
  dataset: DatasetRef;
  lang: string;
  modId?: string;
  bookPath?: string;
  overview?: GuideIndex;
  categoryId?: string;
  messages: GuideMessages;
};

export function GuideCategoryBody({
  dataset,
  lang,
  modId,
  bookPath,
  overview,
  categoryId,
  messages,
}: GuideCategoryBodyProps) {
  const cat = overview?.categories.find((c) => c.id === categoryId);
  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2">
      {(cat?.entries ?? []).map((entry) => (
        <ItemRow
          key={entry.id}
          href={guideBookHref(
            dataset,
            lang,
            modId ?? overview?.modId ?? '',
            bookPath ?? '',
            entry.id,
          )}
          variant="outline"
          className="rounded-xl bg-card p-4"
          media={entry.icon?.id ? (
            <Entry id={entry.icon.id} kind={entry.icon.kind} dataset={dataset} href={false} tooltip={false} />
          ) : null}
          title={entry.name}
          description={
            entry.pageCount
              ? guideMessage(messages, 'guide.page_count', {
                  count: entry.pageCount,
                })
              : undefined
          }
        />
      ))}
    </div>
  );
}

