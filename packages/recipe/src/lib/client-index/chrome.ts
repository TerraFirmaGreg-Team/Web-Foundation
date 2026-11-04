import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type {
  RecipeCategory,
  RecipeChrome,
  RecipeStackGroup,
} from '@terrafirmagreg-team/recipe/types';
import { clientDumpLang, loadClientManifest } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import {
  creativeTabName,
  dumpTextString,
} from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import {
  loadClientRegistry,
  loadClientRegistryOrder,
  resolveClientStackDisplay,
} from '@terrafirmagreg-team/dump/lib/dump/client/registry';
import { loadClientTagMembers } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import { loadClientTabs } from '@terrafirmagreg-team/dump/lib/dump/client/tabs';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import { loadClientRegistryGroups } from '@terrafirmagreg-team/dump/lib/dump/client/groups';
import { loadClientModNames } from '@terrafirmagreg-team/dump/lib/dump/client/mods';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import { lookupSpriteInBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import { stackIdBase, stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { AtlasBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

async function clientEntityNames(
  dataset: DatasetRef,
  lang: string,
  ids: Iterable<string>,
): Promise<Record<string, string>> {
  const [map, items, fluids] = await Promise.all([
    clientDumpLang(dataset, lang),
    loadClientRegistry(dataset, 'items'),
    loadClientRegistry(dataset, 'fluids'),
  ]);
  const all = [...new Set([...items.keys(), ...fluids.keys(), ...ids])];
  const info = new Map<string, { baseId: string; langKey?: string }>();
  const mods = new Set<string>();
  for (const id of all) {
    const baseId = stackIdBase(id);
    const langKey = resolveClientStackDisplay(id, items, fluids)?.name;
    info.set(id, { baseId, ...(langKey ? { langKey } : {}) });
    if (!langKey && baseId.includes(':') && !baseId.startsWith('#')) {
      const mod = baseId.split(':', 2)[0];
      if (mod) mods.add(mod);
    }
  }
  const atlases = new Map<string, AtlasBundle>();
  await Promise.all(
    [...mods].map(async (mod) => {
      atlases.set(mod, await loadClientModAtlases(dataset, mod));
    }),
  );
  const names: Record<string, string> = { ...map };
  let processed = 0;
  for (const [id, entry] of info) {
    if (++processed % 2000 === 0) {
      await new Promise((resolve) => setTimeout(resolve));
    }
    const langKey =
      entry.langKey ??
      lookupSpriteInBundle(
        atlases.get(entry.baseId.split(':', 2)[0] ?? ''),
        entry.baseId,
      )?.sprite.langKey;
    const kind = entry.baseId.startsWith('#')
      ? undefined
      : fluids.has(entry.baseId)
        ? 'fluid'
        : 'item';
    names[id] = stackDisplayName(map, id, kind, langKey);
  }
  return names;
}

async function clientNamedCategories(
  dataset: DatasetRef,
  lang: string,
  types: string[],
  categories: RecipeCategory[],
): Promise<Record<string, string>> {
  const map = await clientDumpLang(dataset, lang);
  const byId = new Map(categories.map((row) => [row.id, row]));
  const names: Record<string, string> = {};
  for (const id of types) {
    names[id] = creativeTabName(map, byId.get(id)?.display?.name ?? id);
  }
  return names;
}

async function clientUsedIds(dataset: DatasetRef): Promise<string[]> {
  const manifest = await loadClientManifest(dataset);
  return manifest?.indexes.used ?? [];
}

async function clientRecipeGroups(
  dataset: DatasetRef,
  lang: string,
): Promise<RecipeStackGroup[]> {
  const rows = await loadClientRegistryGroups(dataset);
  if (!rows.length) return [];
  const map = await clientDumpLang(dataset, lang);
  return rows.map((row) => ({
    id: row.id,
    ...(row.name ? { name: dumpTextString(map, row.name) } : {}),
    members: row.members,
  }));
}

const loadChrome = createDatasetCache(
  async (dataset: DatasetRef, lang: string): Promise<RecipeChrome> => {
    const [items, fluids, creative, categories, usedIds, itemTags, blockTags] =
      await Promise.all([
        loadClientRegistryOrder(dataset, 'item'),
        loadClientRegistryOrder(dataset, 'fluid'),
        loadClientTabs(dataset),
        loadDatasetRecipeCategories(dataset),
        clientUsedIds(dataset),
        loadClientTagMembers(dataset, 'item'),
        loadClientTagMembers(dataset, 'block'),
      ]);
    const tabs = creative.tabs;
    const tabItems = Object.keys(creative.members).length
      ? creative.members
      : undefined;
    const types = categories.map((row) => row.id);
    const tagIds = new Set([
      ...Object.keys(itemTags ?? {}),
      ...Object.keys(blockTags ?? {}),
    ]);
    const nameIds = [
      ...items,
      ...fluids,
      ...tagIds,
      ...(usedIds ?? []),
      ...Object.values(tabItems ?? {}).flat(),
      ...tabs.flatMap((tab) =>
        tab.icon ? [stackIdFromRef(tab.icon)] : [],
      ),
    ];
    const [groups, mods, entityNames, categoryNames, tabNames] =
      await Promise.all([
        clientRecipeGroups(dataset, lang),
        loadClientModNames(dataset, lang),
        clientEntityNames(dataset, lang, nameIds),
        clientNamedCategories(dataset, lang, types, categories),
        clientDumpLang(dataset, lang).then((map) => {
          const names: Record<string, string> = {};
          for (const tab of tabs) {
            names[tab.id] = creativeTabName(map, tab.display.name ?? tab.id);
          }
          return names;
        }),
      ]);
    return {
      items,
      ...(usedIds.length ? { usedIds } : {}),
      ...(fluids.length ? { fluids } : {}),
      ...(tabs.length ? { tabs } : {}),
      ...(tabItems ? { tabItems } : {}),
      ...(categories.length ? { categories } : {}),
      ...(groups.length ? { groups } : {}),
      mods,
      names: {
        [lang]: { ...tabNames, ...categoryNames, ...entityNames },
      },
    };
  },
);

export function loadRecipeChromeClient(
  dataset: DatasetRef,
  lang: string,
): Promise<RecipeChrome> {
  return loadChrome(dataset, lang);
}

