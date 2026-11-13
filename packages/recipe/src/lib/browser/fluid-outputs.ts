import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import { outputBoundary } from '@terrafirmagreg-team/recipe/lib/data/slot-io';
import { loadTypeRows } from '@terrafirmagreg-team/recipe/lib/client-index';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

export type FluidIoIndex = {
  inputs: Map<string, string[]>;
  outputs: Map<string, string[]>;
};

const cache = createDatasetCache(
  build,
  (dataset) => datasetCacheKey(dataset),
);

function tankCategories(index: RecipeCompactIndex, role: 'input' | 'output') {
  return (index.categories ?? []).filter((cat) => {
    const layout = cat.layout;
    if (!layout) return false;
    const bound = outputBoundary({}, layout);
    return layout.slots.some((slot) =>
      slot.role === 'tank' &&
      (role === 'output' ? slot.x >= bound : slot.x < bound),
    );
  });
}

async function build(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
): Promise<FluidIoIndex> {
  const fluids = new Set(index.fluids ?? []);
  const inputs = new Map<string, string[]>();
  const outputs = new Map<string, string[]>();
  const typeIds = new Set([
    ...tankCategories(index, 'input').map((cat) => cat.id),
    ...tankCategories(index, 'output').map((cat) => cat.id),
  ]);
  const perType = await Promise.all(
    [...typeIds].map((typeId) =>
      loadTypeRows(dataset, index, typeId).catch(() => []),
    ),
  );
  for (const rows of perType) {
    for (const row of rows) {
      for (const id of row.in) {
        if (!fluids.has(id)) continue;
        const list = inputs.get(id);
        if (list) list.push(row.id);
        else inputs.set(id, [row.id]);
      }
      for (const id of row.out) {
        if (!fluids.has(id)) continue;
        const list = outputs.get(id);
        if (list) list.push(row.id);
        else outputs.set(id, [row.id]);
      }
    }
  }
  return { inputs, outputs };
}

export function loadFluidIoIndex(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
): Promise<FluidIoIndex> {
  return cache(dataset, index);
}
