import {
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { registryId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { creativeTabName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  ItemPanelCell,
  RecipeCompactIndex,
  RecipeStackGroup,
} from '@terrafirmagreg-team/recipe/types';

function catalogPool(index: RecipeCompactIndex, tab?: string): string[] {
  if (!tab) return [...index.items, ...(index.fluids ?? [])];
  return index.tabItems?.[tab] ?? [];
}

export type ItemPanelMode = 'all' | 'fav';

type ItemPanelTabRow = {
  id: string;
  icon: string;
  iconRef?: TaggedReference;
  help: string;
};

export function panelPool(
  mode: ItemPanelMode,
  favoriteIds: string[],
  index: RecipeCompactIndex | null,
  tab?: string,
): string[] {
  if (!index) return [];
  return mode === 'fav' ? favoriteIds : catalogPool(index, tab);
}

export function buildPanelCells(
  ids: readonly string[],
  groups: RecipeStackGroup[] | undefined,
  expandedGroups: ReadonlySet<string>,
  fluidIds?: ReadonlySet<string>,
): ItemPanelCell[] {
  const cell = (id: string): ItemPanelCell =>
    fluidIds?.has(registryId(id))
      ? { kind: 'stack', id, ref: 'fluid' }
      : { kind: 'stack', id };
  if (!groups?.length) return ids.map(cell);
  const byMember = new Map<string, RecipeStackGroup>();
  for (const group of groups)
    for (const member of group.members) {
      const base = registryId(member);
      if (!byMember.has(base)) byMember.set(base, group);
    }
  const inPool = new Set(ids.map(registryId));
  const seen = new Set<string>();
  const out: ItemPanelCell[] = [];
  for (const id of ids) {
    const base = registryId(id);
    if (seen.has(base)) continue;
    seen.add(base);
    const group = byMember.get(base);
    if (!group) {
      out.push(cell(id));
      continue;
    }
    const members = group.members.filter((member) =>
      inPool.has(registryId(member)),
    );
    for (const member of members) seen.add(registryId(member));
    if (members.length <= 1) {
      out.push(cell(members[0] ?? id));
      continue;
    }
    const expanded = expandedGroups.has(group.id);
    out.push({
      kind: 'group',
      id: group.id,
      label: group.name ?? group.id,
      members,
      expanded,
    });
    if (expanded)
      for (const member of members)
        out.push({
          kind: 'stack',
          id: member,
          groupId: group.id,
          ...(fluidIds?.has(registryId(member)) ? { ref: 'fluid' as const } : {}),
        });
  }
  return out;
}

export function panelTabRows(
  index: RecipeCompactIndex | null,
  names: Record<string, Record<string, string>>,
  lang: Lang,
): ItemPanelTabRow[] {
  const rows: ItemPanelTabRow[] = [];
  for (const row of index?.tabs ?? []) {
    const icon =
      (row.icon ? stackIdFromRef(row.icon) : undefined) ??
      index?.tabItems?.[row.id]?.[0];
    if (!icon) continue;
    rows.push({
      id: row.id,
      icon,
      iconRef: row.icon,
      help: row.display?.name
        ? creativeTabName(names[lang] ?? names.en_us ?? {}, row.display.name)
        : recipeItemName(names, lang, row.id),
    });
  }
  return rows;
}

