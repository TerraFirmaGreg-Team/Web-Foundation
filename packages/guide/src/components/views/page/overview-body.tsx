import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { MediaImage } from '@terrafirmagreg-team/ui/components/blocks/media/image';
import { GuideText } from '@terrafirmagreg-team/guide/components/views/text';
import {
  guideCategoryHref,
  isRootCategory,
} from '@terrafirmagreg-team/guide/lib/paths';
import { texturePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { useDumpLocation } from '@terrafirmagreg-team/game/hooks/use-dump-location';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/messages';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideIndex, GuideMessages } from '@terrafirmagreg-team/guide/types';

type GuideOverviewBodyProps = {
  dataset: DatasetRef;
  lang: Lang;
  modId?: string;
  bookPath?: string;
  overview: GuideIndex;
  categories: Map<string, string>;
  langMap: Record<string, string>;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
  messages: GuideMessages;
};

export function GuideOverviewBody({
  dataset,
  lang,
  modId,
  bookPath,
  overview,
  categories,
  langMap,
  questLinks,
  previews,
  messages,
}: GuideOverviewBodyProps) {
  useDumpLocation(dataset);
  if (overview.status === 'missing') return null;
  return (
    <div className="space-y-6">
      {overview.book?.cover ? (
        <MediaImage
          src={texturePublicUrl(dataset, overview.book.cover.id)}
          alt={overview.book.name}
          eager
          className="h-auto max-h-64 max-w-full rounded-lg border border-border object-contain"
          pixelated
        />
      ) : null}
      {overview.book?.landingText ? (
        <p className="whitespace-pre-wrap text-muted-foreground">
          <GuideText
            text={overview.book.landingText}
            dataset={dataset}
            lang={lang}
            modId={modId}
            bookPath={bookPath}
            categoryByEntry={categories}
            macros={overview.book.macros}
            langMap={langMap}
            questLinks={questLinks}
            previews={previews}
          />
        </p>
      ) : null}
      <div className="not-prose grid gap-3 sm:grid-cols-2">
        {overview.categories
          .filter((cat) => isRootCategory(cat, overview.categories))
          .map((cat) => (
            <ItemRow
              key={cat.id}
              href={guideCategoryHref(
                dataset,
                lang,
                modId ?? overview.modId,
                bookPath ?? '',
                cat,
              )}
              variant="outline"
              className="rounded-xl bg-card p-4"
              media={cat.icon?.id ? (
                <Entry id={cat.icon.id} kind={cat.icon.kind} dataset={dataset} href={false} tooltip={false} />
              ) : null}
              title={cat.name}
              description={guideMessage(messages, 'guide.entry_count', {
                count: cat.entries.length,
              })}
            />
          ))}
      </div>
    </div>
  );
}

