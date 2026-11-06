import {
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { registryId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  ItemPanelCell,
  RecipeCompactIndex,
  RecipeStackGroup,
} from '@terrafirmagreg-team/recipe/types';

function catalogPool(index: RecipeCompactIndex, tab?: string): string[] {
  if (!tab) return index.items;
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
): ItemPanelCell[] {
  if (!groups?.length) return ids.map((id) => ({ kind: 'stack', id }));
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
      out.push({ kind: 'stack', id });
      continue;
    }
    const members = group.members.filter((member) =>
      inPool.has(registryId(member)),
    );
    for (const member of members) seen.add(registryId(member));
    if (members.length <= 1) {
      out.push({ kind: 'stack', id: members[0] ?? id });
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
        out.push({ kind: 'stack', id: member, groupId: group.id });
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
      help: recipeItemName(names, lang, row.display.name ?? row.id),
    });
  }
  return rows;
}

