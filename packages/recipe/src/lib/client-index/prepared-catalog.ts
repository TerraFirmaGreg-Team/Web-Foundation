import { asRecord } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpCreativeTab } from '@terrafirmagreg-team/dump/lib/dump/data/tab/dto';
import type { RecipeCategory } from '@terrafirmagreg-team/recipe/types';
import type { CatalogLabels, PreparedCatalog } from '@terrafirmagreg-team/recipe/types/catalog';

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function stringMap(value: unknown): value is Record<string, string> {
  const row = asRecord(value);
  return !!row && Object.values(row).every((item) => typeof item === 'string');
}

function members(value: unknown): value is Record<string, string[]> {
  const row = asRecord(value);
  return !!row && Object.values(row).every(strings);
}

function orderedRow(value: unknown): value is Record<string, unknown> & { id: string; order: number } {
  const row = asRecord(value);
  return !!row && typeof row.id === 'string' && typeof row.order === 'number' &&
    Number.isFinite(row.order) &&
    (row.icon === undefined || !!asTaggedReference(row.icon));
}

function tab(value: unknown): value is DumpCreativeTab {
  return orderedRow(value) && !!asRecord(value.display);
}

function category(value: unknown): value is RecipeCategory {
  if (!orderedRow(value)) return false;
  if (!Array.isArray(value.workstations) ||
      !value.workstations.every((ref) => !!asTaggedReference(ref))) return false;
  if (value.layout === undefined) return true;
  const layout = asRecord(value.layout);
  return !!layout && typeof layout.w === 'number' && typeof layout.h === 'number' &&
    (layout.scale === undefined || typeof layout.scale === 'number') &&
    (layout.margin === undefined || typeof layout.margin === 'number') &&
    (layout.image === undefined || typeof layout.image === 'string') &&
    Array.isArray(layout.slots) && layout.slots.every((value) => {
      const slot = asRecord(value);
      return !!slot && typeof slot.id === 'string' && typeof slot.role === 'string' &&
        ['x', 'y', 'w', 'h'].every((key) => typeof slot[key] === 'number');
    });
}

function group(value: unknown): value is PreparedCatalog['groups'][number] {
  const row = asRecord(value);
  return !!row && typeof row.id === 'string' && strings(row.members);
}

export function parsePreparedCatalog(value: unknown): PreparedCatalog {
  const row = asRecord(value);
  if (!row || !strings(row.items) || !strings(row.fluids) || !strings(row.usedIds) ||
      !Array.isArray(row.tabs) || !row.tabs.every(tab) ||
      !members(row.tabItems) || !Array.isArray(row.categories) ||
      !row.categories.every(category) || !Array.isArray(row.groups) ||
      !row.groups.every(group)) {
    throw new Error('Invalid required registry/catalog.json');
  }
  return {
    items: row.items,
    fluids: row.fluids,
    usedIds: row.usedIds,
    tabs: row.tabs,
    tabItems: row.tabItems,
    categories: row.categories,
    groups: row.groups,
  };
}

export function parseCatalogLabels(value: unknown): CatalogLabels {
  const row = asRecord(value);
  if (!row || !stringMap(row.mods) || !stringMap(row.names) || !stringMap(row.groups)) {
    throw new Error('Invalid required locale catalog');
  }
  return { mods: row.mods, names: row.names, groups: row.groups };
}
