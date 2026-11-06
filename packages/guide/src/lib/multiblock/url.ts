import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { splitDumpId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { modelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import {
  dumpModelUrl,
  multiblockModelIndex,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { loadMultiblockNameIndex } from '@terrafirmagreg-team/guide/lib/client/books';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideMultiblock } from '@terrafirmagreg-team/guide/types';

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function inlineMultiblockHash(data: unknown): Promise<string> {
  return sha256Hex(JSON.stringify(data));
}

const multiblockIndex = createDatasetCache(async (dataset: DatasetRef) => {
  const dump = await loadDatasetDump(dataset);
  const entries = await Promise.all(
    (dump?.mods ?? []).map(async (ns) => {
      const index = asRecord(
        await multiblockModelIndex(dataset, ns.namespace),
      );
      return Object.entries(index ?? {}).map(
        ([id, rel]) => [id, { ns: ns.namespace, rel: asString(rel) }] as const,
      );
    }),
  );
  return Object.fromEntries(entries.flat());
});

export async function glbFor(
  dataset: DatasetRef,
  _bookModId: string,
  spec: { id?: string; data?: GuideMultiblock },
  lang?: string,
): Promise<string | null> {
  if (spec.id) {
    const direct = await dumpModelUrl(dataset, spec.id);
    if (direct) return direct;
    if (lang) {
      const names = await loadMultiblockNameIndex(dataset, lang as Lang);
      const named = names[spec.id.trim().toLowerCase()];
      if (named) return glbFor(dataset, _bookModId, { data: named }, lang);
    }
    return null;
  }
  if (!spec.data) return null;
  const hash = await inlineMultiblockHash(spec.data);
  const index = await multiblockIndex(dataset);
  for (const [id, { ns, rel }] of Object.entries(index)) {
    if (id.includes(hash) || rel?.includes(hash)) {
      return (
        (await dumpModelUrl(dataset, id)) ??
        modelPublicUrl(dataset, splitDumpId(id)?.ns ?? ns, rel) ??
        null
      );
    }
  }
  return null;
}

