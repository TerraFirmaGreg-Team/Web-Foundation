import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { EntryView } from '@terrafirmagreg-team/guide/components/views/entry/view';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/messages';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  GuideEntry,
  GuideEntryExtras,
  GuideIndex,
  GuideMessages,
} from '@terrafirmagreg-team/guide/types';

type GuideEntryBodyProps = {
  dataset: DatasetRef;
  lang: Lang;
  bookPath?: string;
  overview: GuideIndex;
  entry?: GuideEntry;
  categories: Map<string, string>;
  langMap: Record<string, string>;
  extras?: GuideEntryExtras;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
  messages: GuideMessages;
};

export function GuideEntryBody({
  dataset,
  lang,
  bookPath,
  overview,
  entry,
  categories,
  langMap,
  extras,
  questLinks,
  previews,
  messages,
}: GuideEntryBodyProps) {
  const catIconByEntry = new Map(
    overview.categories.flatMap((category) =>
      category.entries.map((item) => [item.id, category.icon] as const),
    ),
  );
  const entryRefs = new Map(
    overview.entries.map((item) => [
      item.id,
      {
        id: item.id,
        name: item.name ?? item.id,
        icon: item.icon ?? catIconByEntry.get(item.id),
      },
    ]),
  );
  if (!entry || !bookPath) {
    return (
      <EmptyState variant="missing">
        {guideMessage(messages, 'guide.entry_missing')}
      </EmptyState>
    );
  }
  return (
    <EntryView
      dataset={dataset}
      lang={lang}
      bookPath={bookPath}
      entry={entry}
      bookModId={overview.modId}
      categoryByEntry={categories}
      book={overview.book}
      langMap={langMap}
      entryRefs={entryRefs}
      extras={extras}
      questLinks={questLinks}
      previews={previews}
      messages={messages}
    />
  );
}

