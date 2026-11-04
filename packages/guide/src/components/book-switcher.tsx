'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { guideQueryFromParams } from '@terrafirmagreg-team/guide/lib/query';
import { listGuideBooks } from '@terrafirmagreg-team/guide/lib/books';
import { guideHref } from '@terrafirmagreg-team/guide/lib/links';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';
import { Switcher } from '@terrafirmagreg-team/ui/components/blocks/nav/switcher';

function oneLineLanding(text: string | undefined) {
  if (!text) return undefined;
  const stripped = text.replace(/\$\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped || undefined;
}

export function GuideBookSwitcher() {
  const t = useTranslations();
  const { dataset: datasetId } = parseSectionLocation(usePathname());
  const lang = useResolvedLang();
  const params = useLocationSearchParams();
  const { bookId } = guideQueryFromParams(params);
  const version = params.get('version') ?? undefined;
  const dataset = useMemo(
    () => (datasetId ? { id: datasetId, version } : undefined),
    [datasetId, version],
  );
  const books = useAsyncValue(
    dataset ? () => listGuideBooks(dataset, lang) : undefined,
    [dataset, lang],
  );
  if (!books || books.length < 2 || !dataset) return null;
  return (
    <Switcher
      options={books.map((book) => ({
        value: book.bookId,
        title: book.name,
        description: oneLineLanding(book.landingText),
        icon: <BookOpen className="size-4" />,
        url: guideHref(dataset, lang, book.bookId),
      }))}
      selected={bookId}
      placeholder={t('Select book', { note: 'ui.select_book' })}
    />
  );
}

