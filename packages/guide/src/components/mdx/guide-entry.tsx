'use client';

import { usePathname } from 'next/navigation';
import { useContext } from 'react';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { useEntryContext } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import { ResolvedLangContext } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { findClientGuideEntry } from '@terrafirmagreg-team/guide/lib/client/books';
import type { GuideDirectiveProps } from '@terrafirmagreg-team/game/types/entry';

export function GuideEntry({
  id,
  dataset: datasetProp,
  name,
  modId,
  bookPath,
  entry: entryOpt,
  ...rest
}: GuideDirectiveProps) {
  const ctx = useEntryContext();
  const pathname = usePathname();
  const locId = parseSectionLocation(pathname).dataset;
  const dataset =
    datasetProp ?? ctx?.dataset ?? (locId ? { id: locId } : undefined);
  const lang = useContext(ResolvedLangContext)?.lang;
  const hit = useAsyncValue(
    dataset && lang && id
      ? () => findClientGuideEntry(dataset, lang, id)
      : false,
    [dataset, lang, id],
  );
  return (
    <Entry
      kind="guide"
      id={hit?.entry.id ?? id}
      dataset={dataset}
      name={name ?? hit?.entry.name}
      icon={hit?.entry.icon}
      modId={modId ?? hit?.modId}
      bookPath={bookPath ?? hit?.bookPath}
      entry={entryOpt ?? hit?.entry.id}
      {...rest}
    />
  );
}

