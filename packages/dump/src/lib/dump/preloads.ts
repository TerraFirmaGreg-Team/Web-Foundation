import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { clientDumpJson } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import {
  dumpPublicUrl,
  dumpStorageUrl,
} from '@terrafirmagreg-team/dump/lib/dump/paths';

export async function dumpPreloadHrefs(
  dataset: DatasetRef,
  rels: readonly string[],
): Promise<{ origin?: string; hrefs: string[] }> {
  await clientDumpJson(dataset, 'manifest.json', 'high').catch(
    () => undefined,
  );
  const hrefs: string[] = [];
  for (const rel of rels) {
    const url = dumpPublicUrl(dataset, rel);
    if (url) hrefs.push(url);
  }
  let origin: string | undefined;
  try {
    origin = new URL(dumpStorageUrl('')).origin;
  } catch {

  }
  return { origin, hrefs };
}
