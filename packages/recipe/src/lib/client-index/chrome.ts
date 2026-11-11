import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type {
  RecipeCategory,
  RecipeChrome,
  RecipeStackGroup,
} from '@terrafirmagreg-team/recipe/types';
import {
  clientDumpLang,
  clientDumpNames,
  loadClientManifest,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import {
  creativeTabName,
  dumpTextString,
} from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { loadClientRegistryOrder } from '@terrafirmagreg-team/dump/lib/dump/client/registry';
import { loadClientTagMembers } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import { loadClientTabs } from '@terrafirmagreg-team/dump/lib/dump/client/tabs';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import { loadClientRegistryGroups } from '@terrafirmagreg-team/dump/lib/dump/client/groups';
import { loadClientModNames } from '@terrafirmagreg-team/dump/lib/dump/client/mods';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

async function clientEntityNames(
  dataset: DatasetRef,
  lang: string,
  ids: Iterable<string>,
): Promise<Record<string, string>> {
  const table = await clientDumpNames(dataset, lang);
  for (const id of ids) {
    if (table[id] === undefined) {
      throw new Error(
        `dump names missing id "${id}" for ${dataset.id} lang=${lang}`,
      );
    }
  }
  return { ...table };
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
    const [items, fluids, creative, categories, usedIds] = await Promise.all([
      loadClientRegistryOrder(dataset, 'item'),
      loadClientRegistryOrder(dataset, 'fluid'),
      loadClientTabs(dataset),
      loadDatasetRecipeCategories(dataset),
      clientUsedIds(dataset),
    ]);
    const tabs = creative.tabs;
    const tabItems = Object.keys(creative.members).length
      ? creative.members
      : undefined;
    const types = categories.map((row) => row.id);
    const [groups, mods, categoryNames, tabNames] = await Promise.all([
      clientRecipeGroups(dataset, lang),
      loadClientModNames(dataset, lang),
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
        [lang]: { ...tabNames, ...categoryNames },
      },
    };
  },
);

const loadEntityNames = createDatasetCache(
  async (
    dataset: DatasetRef,
    chrome: RecipeChrome,
    lang: string,
  ): Promise<Record<string, string>> => {
    const [itemTags, blockTags] = await Promise.all([
      loadClientTagMembers(dataset, 'item'),
      loadClientTagMembers(dataset, 'block'),
    ]);
    const tagIds = new Set([
      ...Object.keys(itemTags ?? {}),
      ...Object.keys(blockTags ?? {}),
    ]);
    const nameIds = [
      ...chrome.items,
      ...(chrome.fluids ?? []),
      ...tagIds,
      ...(chrome.usedIds ?? []),
      ...Object.values(chrome.tabItems ?? {}).flat(),
      ...(chrome.tabs ?? []).flatMap((tab) =>
        tab.icon ? [stackIdFromRef(tab.icon)] : [],
      ),
    ];
    return clientEntityNames(dataset, lang, nameIds);
  },
  (dataset, _chrome, lang) => `${dataset.id}/${dataset.version ?? ''} ${lang}`,
);

export function loadRecipeChromeClient(
  dataset: DatasetRef,
  lang: string,
): Promise<RecipeChrome> {
  return loadChrome(dataset, lang);
}

export function loadRecipeEntityNames(
  dataset: DatasetRef,
  chrome: RecipeChrome,
  lang: string,
): Promise<Record<string, string>> {
  return loadEntityNames(dataset, chrome, lang);
}

