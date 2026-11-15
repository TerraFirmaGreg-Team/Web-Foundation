import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type {
  CalcKind,
  CalcNode,
} from '@terrafirmagreg-team/recipe/types/calc';
import type {
  Recipe,
  RecipeWidget,
} from '@terrafirmagreg-team/recipe/lib/data/dto';

export type MemberRequest = { node: CalcNode; input?: number };

export type MemberTarget = {
  tagId: string;
  members: string[];
  selected: string | undefined;
  kind: CalcKind;
};

export function memberTarget(
  req: MemberRequest,
  selections: Record<string, string> = {},
): MemberTarget | undefined {
  const { node, input } = req;
  if (input == null) {
    if (!node.tagId || !node.members?.length) return undefined;
    const picked = selectionFor(node.tagId, selections);
    return {
      tagId: node.tagId,
      members: node.members,
      selected:
        (picked
          ? node.members.find(
              (m) => stackIdBase(m) === stackIdBase(picked),
            )
          : undefined) ?? node.materialId,
      kind: node.kind,
    };
  }
  const slot = node.inputs[input];
  if (!slot?.tagId || !slot.members?.length) return undefined;
  return {
    tagId: slot.tagId,
    members: slot.members,
    selected: slot.id,
    kind: slot.kind,
  };
}

function selectionFor(
  tagId: string,
  selections: Record<string, string>,
): string | undefined {
  const key = tagId.replace(/^#+/, '');
  return selections[key] ?? selections[tagId] ?? selections[`#${key}`];
}

export function pinnedRecipe(
  recipe: Recipe,
  node: CalcNode,
  selections: Record<string, string>,
): Recipe {
  const picked = new Map<string, string>();
  for (const input of node.inputs) {
    if (!input.tagId) continue;
    const member = selectionFor(input.tagId, selections);
    if (member) picked.set(input.tagId, member);
  }
  if (!picked.size) return recipe;
  let changed = false;
  const source: RecipeWidget[] = recipe.widgets;
  const widgets = source.map((widget) => {
    if (widget.type !== 'slot' || widget.kind !== 'tag') return widget;
    const member =
      picked.get(widget.id) ??
      picked.get(`#${widget.id.replace(/^#+/, '')}`);
    if (!member) return widget;
    const memberBase = stackIdBase(member);
    const pinned =
      widget.alternatives?.find(
        (alt) => stackIdBase(alt) === memberBase,
      ) ?? member;
    if (widget.alternatives?.length === 1 && widget.alternatives[0] === pinned) {
      return widget;
    }
    changed = true;
    return { ...widget, alternatives: [pinned] };
  });
  return changed ? { ...recipe, widgets } : recipe;
}
