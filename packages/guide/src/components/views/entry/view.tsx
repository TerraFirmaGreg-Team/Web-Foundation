import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { EntryPages } from '@terrafirmagreg-team/guide/components/views/entry/pages';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  GuideBook,
  GuideEntry,
  GuideEntryExtras,
  GuideEntryRef,
  GuideMessages,
} from '@terrafirmagreg-team/guide/types';

export function EntryView({
  dataset,
  lang,
  bookPath,
  entry,
  bookModId,
  categoryByEntry,
  book,
  langMap,
  entryRefs,
  extras,
  questLinks,
  previews,
  messages,
}: {
  dataset: DatasetRef;
  lang: Lang;
  bookPath: string;
  entry: GuideEntry;
  bookModId: string;
  categoryByEntry: Map<string, string>;
  book?: GuideBook | null;
  langMap: Record<string, string>;
  entryRefs: Map<string, GuideEntryRef>;
  extras?: GuideEntryExtras;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
  messages: GuideMessages;
}) {
  return (
    <EntryPages
      dataset={dataset}
      lang={lang}
      bookPath={bookPath}
      pages={entry.pages ?? []}
      atlases={extras?.atlases}
      bookModId={bookModId}
      categoryByEntry={categoryByEntry}
      book={book}
      langMap={langMap}
      entryRefs={entryRefs}
      keybinds={extras?.keybinds}
      extras={extras}
      questLinks={questLinks}
      previews={previews}
      messages={messages}
    />
  );
}

