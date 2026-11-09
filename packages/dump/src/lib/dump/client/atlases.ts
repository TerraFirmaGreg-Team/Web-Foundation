import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { AtlasBundle, IconAtlas } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import {
  iconAtlasFromEntries,
  mergeAtlases,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/sprites';
import {
  clientRegistryIconsEntries,
  loadClientManifest,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { serverCache } from '@terrafirmagreg-team/data/lib/server-cache';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

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
        await clientRegistryIconsEntries(dataset, 'blocks', modId, 'high'),
        dataset,
        modId,
        'blocks',
        'block',
      );
    }
    const [items, fluids] = await Promise.all([
      has('items')
        ? clientRegistryIconsEntries(dataset, 'items', modId, 'high')
        : undefined,
      has('fluids')
        ? clientRegistryIconsEntries(dataset, 'fluids', modId, 'high')
        : undefined,
    ]);
    return mergeAtlases(
      [
        items
          ? iconAtlasFromEntries(items, dataset, modId, 'items', 'item')
          : null,
        fluids
          ? iconAtlasFromEntries(fluids, dataset, modId, 'fluids', 'item')
          : null,
      ],
      dataset,
      modId,
      'item',
    );
  },
);

export const loadClientModAtlases = createDatasetCache(
  async (dataset: DatasetRef, modId: string): Promise<AtlasBundle> => {
    const load = async (): Promise<AtlasBundle> => {
      const [items, blocks] = await Promise.all([
        loadClientModAtlas(dataset, modId, 'items'),
        loadClientModAtlas(dataset, modId, 'blocks'),
      ]);
      return { items, blocks };
    };
    const cache = serverCache();
    if (!cache) return load();
    try {
      return (await cache(
        `atlas-bundle:${dataset.id}:${dataset.version ?? ''}:${modId}`,
        load,
        dataset.version ? false : 60,
      )) as AtlasBundle;
    } catch {
      return load();
    }
  },
);

