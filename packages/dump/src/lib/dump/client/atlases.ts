import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { AtlasBundle, IconAtlas } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import {
  iconAtlasFromEntries,
  mergeAtlases,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/sprites';
import {
  clientDumpJson,
  loadClientManifest,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { asRecord } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

async function modEntries(
  dataset: DatasetRef,
  modId: string,
  kind: string,
): Promise<Record<string, unknown> | undefined> {
  const entries = asRecord(
    await clientDumpJson(dataset, `registry/${kind}.json`, 'high'),
  );
  if (!entries) return undefined;
  const prefix = `${modId}:`;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (key.startsWith(prefix)) out[key] = value;
  }
  return out;
}

const loadClientModAtlas = createDatasetCache(
  async (
    dataset: DatasetRef,
    modId: string,
    kind: 'items' | 'blocks',
  ): Promise<IconAtlas | null> => {
    const manifest = await loadClientManifest(dataset);
    const listed = manifest?.namespaces[modId];
    if (!listed) return null;
    const has = (file: string) => listed.registry.includes(file);
    if (kind === 'blocks') {
      if (!has('blocks')) return null;
      return iconAtlasFromEntries(
        await modEntries(dataset, modId, 'blocks'),
        dataset,
        modId,
        'blocks',
        'block',
      );
    }
    return mergeAtlases(
      [
        has('items')
          ? iconAtlasFromEntries(
              await modEntries(dataset, modId, 'items'),
              dataset,
              modId,
              'items',
              'item',
            )
          : null,
        has('fluids')
          ? iconAtlasFromEntries(
              await modEntries(dataset, modId, 'fluids'),
              dataset,
              modId,
              'fluids',
              'item',
            )
          : null,
      ],
      dataset,
      modId,
      'item',
    );
  },
);

export const loadClientModAtlases = createDatasetCache(
  async (dataset: DatasetRef, modId: string): Promise<AtlasBundle> => ({
    items: await loadClientModAtlas(dataset, modId, 'items'),
    blocks: await loadClientModAtlas(dataset, modId, 'blocks'),
  }),
);

