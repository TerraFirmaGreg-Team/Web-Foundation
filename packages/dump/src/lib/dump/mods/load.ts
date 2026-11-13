import { loadDatasetVersions, resolveDatasetSnapshot } from '../snapshot';
import { dumpLocation } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { createDatasetCache, dumpReader } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { parseDumpManifest } from '@terrafirmagreg-team/dump/lib/dump/manifest/parse';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { dumpIndexFromManifest } from '@terrafirmagreg-team/dump/lib/dump/mods/index';
import type { DumpIndex } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';

const dumpCache = createDatasetCache(
  async (dataset: DatasetRef): Promise<DumpIndex | null> => {
    const reader = await dumpReader(dataset);
    const manifest = parseDumpManifest(await reader.getJson('manifest.json'));
    if (!manifest) {
      throw new Error(
        `dump manifest unavailable: ${dataset.id}${dataset.version ? `/${dataset.version}` : ''}`,
      );
    }
    return dumpIndexFromManifest(
      manifest,
      dumpLocation(dataset)?.root ?? dataset.id,
    );
  },
);

export function loadDatasetDump(dataset: DatasetRef): Promise<DumpIndex | null> {
  return dumpCache(dataset);
}

export async function discoverDumpDatasets(
  datasetIds: readonly string[],
): Promise<DatasetRef[]> {
  const refs = await Promise.all(
    datasetIds.map(async (id) => {
      const versions = await loadDatasetVersions(id);
      const latest = versions?.latest;
      if (!versions || !latest) return [];
      const listed = versions.versions;
      const [manifest, published] = await Promise.all([
        dumpReader({ id }).then((reader) => reader.getJson('manifest.json')),
        Promise.all(
          listed.map(async (version): Promise<DatasetRef | null> => {
            const ref = await resolveDatasetSnapshot({ id, version });
            const ok = await dumpReader(ref).then((reader) =>
              reader.getJson('manifest.json'),
            );
            return ok ? ref : null;
          }),
        ),
      ]);
      if (!manifest) return [];
      return [{ id }, ...published.filter((row): row is DatasetRef => row !== null)];
    }),
  );
  return refs.flat().sort((a, b) =>
    a.id.localeCompare(b.id) || (a.version ?? '').localeCompare(b.version ?? ''),
  );
}
