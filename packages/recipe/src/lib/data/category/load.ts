import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asCategory } from '@terrafirmagreg-team/recipe/lib/data/category/parse';
import type { DumpRecipeCategory } from '@terrafirmagreg-team/recipe/lib/data/category/dto';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import { clientDumpJson } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { asRecord } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

const cache = createDatasetCache(
  async (dataset: DatasetRef): Promise<DumpRecipeCategory[]> => {
    const out: DumpRecipeCategory[] = [];
    const dump = await loadDatasetDump(dataset);
    if (dump) {
      const seen = new Set<string>();
      const rows = await Promise.all(
        dump.mods.flatMap((ns) => {
          if (!ns.recipeCategories || seen.has(ns.recipeCategories)) {
            return [];
          }
          seen.add(ns.recipeCategories);
          return [clientDumpJson(dataset, ns.recipeCategories)];
        }),
      );
      for (const row of rows) {
        const entries = asRecord(row);
        if (!entries) continue;
        for (const [catalogKey, raw] of Object.entries(entries)) {
          const cat = asCategory(
            raw && typeof raw === 'object' && !Array.isArray(raw) && !('id' in raw)
              ? { ...raw, id: catalogKey }
              : raw,
          );
          if (cat) out.push(cat);
        }
      }
    }
    out.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
    return out;
  },
);

export function loadDatasetRecipeCategories(
  dataset: DatasetRef,
): Promise<DumpRecipeCategory[]> {
  return cache(dataset);
}

