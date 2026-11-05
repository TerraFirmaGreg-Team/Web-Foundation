'use client';

import { useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  type DatasetRef,
  parseSectionLocation,
} from '@terrafirmagreg-team/sites/location';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useDumpLocation } from '@terrafirmagreg-team/game/hooks/use-dump-location';
import { ResolvedLangContext } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { createDumpAssetResolver } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { asMultiblock } from '@terrafirmagreg-team/guide/lib/meta';
import { glbFor } from '@terrafirmagreg-team/guide/lib/multiblock/url';
import { loadMultiblockNameIndex } from '@terrafirmagreg-team/guide/lib/client/guides';
import { multiblockKey } from '@terrafirmagreg-team/guide/lib/multiblock';
import { MultiblockVisual } from '@terrafirmagreg-team/guide/components/views/kind/media';
import type { GuideMultiblock } from '@terrafirmagreg-team/guide/types';

export type MdxMultiblockProps = {
  id?: string;
  name?: string;
  spec?: string;
  label?: string;
  dataset?: DatasetRef | string;
  title?: string;
};

export function MdxMultiblock({
  id,
  name,
  spec,
  label,
  dataset: datasetProp,
  title,
}: MdxMultiblockProps) {
  const pathname = usePathname();
  const locId = parseSectionLocation(pathname).dataset;
  const dataset = useMemo<DatasetRef>(() => {
    if (typeof datasetProp === 'string') {
      const trimmed = datasetProp.trim();
      try {
        return JSON.parse(trimmed) as DatasetRef;
      } catch {
        return { id: trimmed };
      }
    }
    return datasetProp ?? { id: locId ?? '' };
  }, [datasetProp, locId]);
  const lang = useContext(ResolvedLangContext)?.lang;
  const dumpLoc = useDumpLocation(dataset);
  const resolveResource = useMemo(
    () => createDumpAssetResolver(dataset),
    [dataset],
  );
  const namedSpec = useAsyncValue(
    dataset && lang && name
      ? async () =>
          (await loadMultiblockNameIndex(dataset, lang))[
            name.trim().toLowerCase()
          ]
      : false,
    [dataset, lang, name],
  );
  const value = useMemo<string | GuideMultiblock | undefined>(() => {
    if (spec) {
      try {
        return JSON.parse(spec) as GuideMultiblock;
      } catch {
        return undefined;
      }
    }
    if (name) return namedSpec;
    return id;
  }, [id, name, spec, namedSpec]);
  const key = multiblockKey(asMultiblock(value));
  const src = useAsyncValue(
    dataset && key
      ? () => glbFor(dataset, '', asMultiblock(value), lang)
      : false,
    [dataset, key, lang, dumpLoc],
  );
  const glbs = src && key ? { [key]: src } : undefined;
  return (
    <MultiblockVisual
      value={value}
      title={title ?? label ?? id ?? name}
      glbs={glbs}
      resolveResource={resolveResource}
    />
  );
}

