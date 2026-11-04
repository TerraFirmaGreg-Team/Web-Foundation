'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { useEntryContext } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import { useLangMap } from '@terrafirmagreg-team/game/hooks/use-lang-map';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import {
  type DatasetRef,
  parseSectionLocation,
} from '@terrafirmagreg-team/sites/location';
import { lookupSpriteInBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import { stackDisplayName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import { fetchTagItem } from '@terrafirmagreg-team/game/lib/entry/icon-load';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type ItemIconProps = {
  id?: string;
  dataset?: DatasetRef;
  lang?: Lang;
  label?: string;
  children?: React.ReactNode;
} & ComponentProps<'div'>;

export function ItemIcon({
  id,
  dataset: datasetProp,
  lang: langProp,
  label,
  children,
}: ItemIconProps) {
  const ctx = useEntryContext();
  const pathname = usePathname();
  const locId = parseSectionLocation(pathname).dataset;
  const dataset =
    datasetProp ?? ctx?.dataset ?? (locId ? { id: locId } : undefined);
  const resolvedLang = useResolvedLang();
  const lang = langProp ?? ctx?.lang ?? resolvedLang;
  const iconId = useAsyncValue(
    dataset && id?.startsWith('#')
      ? () => fetchTagItem(dataset, id, 'item').then((item) => item ?? id)
      : false,
    [dataset, id],
  ) ?? id;
  const langKey = useAsyncValue(
    dataset && iconId?.includes(':') && !iconId.startsWith('#')
      ? () =>
          loadClientModAtlases(dataset, iconId.split(':', 2)[0]!).then(
            (bundle) => lookupSpriteInBundle(bundle, iconId)?.sprite.langKey,
          )
      : false,
    [dataset, iconId],
  );
  const fetchedMap = useLangMap(dataset, lang, !ctx?.langMap);
  const map = ctx?.langMap ?? fetchedMap ?? {};
  const resolved =
    label ?? (iconId ? stackDisplayName(map, iconId, undefined, langKey) : undefined);
  if (!iconId) return children ? <>{children}</> : null;
  return (
    <Entry
      kind="item"
      id={iconId}
      dataset={dataset}
      lang={lang}
      name={resolved ?? iconId}
      labeled
      label={resolved}
      href={false}
    >
      {children}
    </Entry>
  );
}

