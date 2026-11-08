import type {
  CalcCard,
  CalcKind,
  CalcMaterial,
  CalcNode,
  CalcNodeInput,
  CalcOutput,
  CalcRecipe,
  CalcRecipeSummary,
  CalcWire,
  TagResolution,
} from '@terrafirmagreg-team/recipe/types/calc';
import { mergeAmounts } from './tree/materials';
import { resolveWireEnds } from './wire';

export type SchemeContext = {
  recipeMap: Map<string, CalcRecipe>;
  getRecipesForItem: (materialId: string, kind: CalcKind) => CalcRecipeSummary[];
  tagMembers: (tagId: string) => TagResolution | undefined;
  tagSelections: Record<string, string>;
  recipesResolved: (id: string) => boolean;
  deadIds: ReadonlySet<string>;
};

function outputAmount(
  recipe: CalcRecipe,
  materialId: string,
  kind: CalcKind,
): number {
  return recipe.outputs
    .filter((out) => out.id === materialId && out.kind === kind)
    .reduce((sum, out) => sum + out.amount * (out.chance ?? 1), 0);
}

function inputMember(
  input: CalcRecipe['inputs'][number],
  ctx: SchemeContext,
): { id?: string; kind: CalcKind; members?: string[] } {
  if (!input.tagId) return { id: input.id, kind: input.kind };
  const picked = ctx.tagSelections[input.tagId];
  const resolution = ctx.tagMembers(input.tagId);
  const members = resolution?.members ?? [];
  const memberId =
    picked && members.includes(picked) ? picked : members[0];
  return {
    id: memberId,
    kind: resolution?.kind ?? input.kind,
    members: members.length ? members : undefined,
  };
}

export function buildScheme({
  cards,
  wires,
  ctx,
}: {
  cards: readonly CalcCard[];
  wires: readonly CalcWire[];
  ctx: SchemeContext;
}): { nodes: CalcNode[]; flows: (number | undefined)[] } {
  const byId = new Map<string, CalcNode>();
  const nodes = cards.map((card) => {
    const availableRecipes = ctx.getRecipesForItem(card.materialId, card.kind);
    const recipe = card.recipeId
      ? (ctx.recipeMap.get(card.recipeId) ?? null)
      : null;
    const resolved = card.recipeId ? !!recipe : true;
    const out = recipe
      ? outputAmount(recipe, card.materialId, card.kind)
      : 1;
    const produced = card.crafts * out;
    const outputs: CalcOutput[] = [];
    const addOutput = (entry: CalcOutput) => {
      if (!(entry.amount > 0)) return;
      const same = outputs.find(
        (o) => o.id === entry.id && o.kind === entry.kind,
      );
      if (same) {
        same.amount += entry.amount;
        same.remaining += entry.amount;
      } else {
        outputs.push(entry);
      }
    };
    addOutput({
      id: card.materialId,
      kind: card.kind,
      amount: produced,
      ...(card.materialId.startsWith('#')
        ? { tagId: card.materialId }
        : {}),
      allocated: 0,
      remaining: produced,
    });
    for (const o of recipe?.outputs ?? []) {
      if (o.id === card.materialId && o.kind === card.kind) continue;
      addOutput({
        id: o.id,
        kind: o.kind,
        amount: o.amount * card.crafts,
        chance: o.chance,
        ...(o.tagId !== undefined ? { tagId: o.tagId } : {}),
        allocated: 0,
        remaining: o.amount * card.crafts,
      });
    }
    const node: CalcNode = {
      id: card.id,
      materialId: card.materialId,
      kind: card.kind,
      crafts: card.crafts,
      produced,
      allocated: 0,
      remaining: produced,
      outputs,
      recipe,
      inputs: (recipe?.inputs ?? []).map((entry) => {
        const member = inputMember(entry, ctx);
        return {
          id: member.id,
          kind: member.kind,
          amount: entry.catalyst
            ? entry.amount
            : entry.amount * card.crafts,
          catalyst: entry.catalyst,
          tagId: entry.tagId,
          ...(member.members ? { members: member.members } : {}),
          wired: false,
          covered: 0,
        } satisfies CalcNodeInput;
      }),
      availableRecipes,
      ...(card.materialId.startsWith('#')
        ? {
            tagId: card.materialId,
            members: ctx.tagMembers(card.materialId)?.members,
          }
        : {}),
      cycle: false,
      products: false,
      loading:
        !ctx.recipesResolved(card.materialId) ||
        (card.recipeId ? !resolved && !ctx.deadIds.has(card.recipeId) : false),
    };
    byId.set(card.id, node);
    return node;
  });

  const flows: (number | undefined)[] = new Array(wires.length);
  const deg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  wires.forEach((wire, wireIndex) => {
    const src = byId.get(wire.from);
    const dst = byId.get(wire.to);
    if (!src || !dst || src === dst) return;
    const ends = resolveWireEnds(src, dst, wire);
    if (!ends) return;
    const input = dst.inputs[ends.inputIndex];
    const srcOut = src.outputs[ends.outIndex];
    if (!input?.id || !srcOut) return;
    input.wired = true;
    const covered = Math.min(
      Math.max(srcOut.remaining, 0),
      input.amount - input.covered,
      wire.amount ?? Infinity,
    );
    input.covered += covered;
    srcOut.allocated += covered;
    srcOut.remaining -= covered;
    if (ends.outIndex === 0) {
      src.allocated += covered;
      src.remaining -= covered;
    }
    flows[wireIndex] = covered;
    adj.set(wire.from, [...(adj.get(wire.from) ?? []), wire.to]);
    deg.set(wire.to, (deg.get(wire.to) ?? 0) + 1);
  });

  const cyclic = (start: string): boolean => {
    const seen = new Set<string>();
    const walk = (id: string): boolean => {
      for (const next of adj.get(id) ?? []) {
        if (next === start) return true;
        if (seen.has(next)) continue;
        seen.add(next);
        if (walk(next)) return true;
      }
      return false;
    };
    return walk(start);
  };
  for (const node of nodes) node.cycle = cyclic(node.id);

  for (const node of nodes) {
    node.products = !(adj.get(node.id)?.length);
  }
  return { nodes, flows };
}

export function schemeSummary(nodes: readonly CalcNode[]) {
  const raw: CalcMaterial[] = [];
  const catalysts: CalcMaterial[] = [];
  const surplus: CalcMaterial[] = [];
  const products: CalcMaterial[] = [];
  for (const node of nodes) {
    for (const input of node.inputs) {
      if (!input.id) continue;
      if (input.catalyst) {
        catalysts.push({ id: input.id, kind: input.kind, amount: input.amount });
        continue;
      }
      const deficit = input.amount - input.covered;
      if (deficit > 0) raw.push({ id: input.id, kind: input.kind, amount: deficit });
    }
    if (!node.recipe && node.produced > 0 && !node.products) {
      raw.push({ id: node.materialId, kind: node.kind, amount: node.produced });
    }
    if (node.products && node.produced > 0) {
      products.push({ id: node.materialId, kind: node.kind, amount: node.produced });
    }
    for (const out of node.outputs.slice(node.products ? 1 : 0)) {
      if (out.remaining > 0) {
        surplus.push({ id: out.id, kind: out.kind, amount: out.remaining });
      }
    }
  }
  return {
    raw: mergeAmounts(raw),
    catalysts,
    remainders: mergeAmounts(surplus),
    products: mergeAmounts(products),
  };
}

