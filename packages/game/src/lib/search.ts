import { staticClient } from 'fumadocs-core/search/client/orama-static';
import type { SearchClientSourceCtx } from '@terrafirmagreg-team/search/lib/sources';
import { resolveDatasetSnapshot, snapshotStorageRoot } from '@terrafirmagreg-team/dump/lib/dump/snapshot';
import { dumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { dumpStorageUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { datasetCacheKey } from '@terrafirmagreg-team/sites/location';

export function dumpSearchClientSource({ refs, locale, tag }: SearchClientSourceCtx) {
  return {
    deps: [JSON.stringify(refs.map((ref) => datasetCacheKey(ref))), locale, String(tag)],
    async search(query: string) {
      const lists = await Promise.all(
        refs.map(async (ref) => {
          const snapshot = await resolveDatasetSnapshot(ref);
          await (await dumpReader(snapshot)).getJson('manifest.json');
          const url = dumpStorageUrl(`${snapshotStorageRoot(snapshot)}/search/${locale}.json`);
          return Promise.resolve(
            staticClient({ locale, tag, from: url }).search(query),
          ).catch(() => []);
        }),
      );
      return lists.flat();
    },
  };
}
