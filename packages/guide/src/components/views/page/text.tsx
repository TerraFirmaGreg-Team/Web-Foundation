import { GuideText } from '@terrafirmagreg-team/guide/components/views/text';
import { pageTexts } from '@terrafirmagreg-team/guide/lib/page-kind';
import type { PageRendererProps } from '@terrafirmagreg-team/guide/types';

type PageTextProps = Pick<
  PageRendererProps,
  | 'page'
  | 'dataset'
  | 'lang'
  | 'bookPath'
  | 'bookModId'
  | 'categoryByEntry'
  | 'langMap'
  | 'keybinds'
  | 'book'
  | 'questLinks'
  | 'previews'
>;

export function PageText({
  page,
  dataset,
  lang,
  bookPath,
  bookModId,
  categoryByEntry,
  book,
  langMap,
  keybinds,
  questLinks,
  previews,
}: PageTextProps) {
  return (
    <>
      {pageTexts(page).map((text, index) => (
        <div
          key={index}
          className="whitespace-pre-wrap text-sm leading-relaxed"
        >
          <GuideText
            text={text}
            dataset={dataset}
            lang={lang}
            modId={bookModId}
            bookPath={bookPath}
            categoryByEntry={categoryByEntry}
            macros={book?.macros}
            langMap={langMap}
            keybinds={keybinds}
            questLinks={questLinks}
            previews={previews}
          />
        </div>
      ))}
    </>
  );
}

