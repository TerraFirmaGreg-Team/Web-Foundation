import { staticClient } from 'fumadocs-core/search/client/orama-static';
import type { SearchClientSourceCtx } from '@terrafirmagreg-team/search/lib/sources';
import { loadClientVersions } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { dumpStorageUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';

export function dumpSearchClientSource({ refs, locale, tag }: SearchClientSourceCtx) {
  return {
    deps: [JSON.stringify(refs.map(({ id, version }) => [id, version])), locale, String(tag)],
    async search(query: string) {
      const lists = await Promise.all(
        refs.map(async ({ id, version }) => {
          const ver = version ?? (await loadClientVersions(id))?.latest;
          if (!ver) return [];
          const run = async (from: string) =>
            staticClient({ locale, tag, from }).search(query);
          return run(dumpStorageUrl(`${id}/${ver}/search/${locale}.json`))
            .catch(() =>
              run(
                `/api/search/dump?id=${encodeURIComponent(id)}&ver=${encodeURIComponent(ver)}&lang=${encodeURIComponent(locale)}`,
              ),
            )
            .catch(() => run(dumpStorageUrl(`${id}/${ver}/search.json`)))
            .catch(() => []);
        }),
      );
      return lists.flat();
    },
  };
}

