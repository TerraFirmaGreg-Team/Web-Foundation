import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Edge, Node } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { PORT_IN } from '@terrafirmagreg-team/recipe/lib/calc/ports';
import type {
  CalcKind,
  CalcNode,
  CalcRecipeSummary,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { FlowPoint } from '@terrafirmagreg-team/ui/types/canvas';

export const CALC_NODE_W = 232;
export const CALC_NODE_H = 76;

export const CALC_LOD_FAR = 0.45;

export const CALC_LOD_DOT = 0.15;
const CALC_MINI_W = 96;
const CALC_MINI_TAG_H = 84;

export type CalcViewMode = 'mini' | 'normal' | 'detailed';
export type CalcFarMode = 'full' | 'preview' | 'hidden';

export const GRID_GAPS = { x: 14, y: 24, goal: 48 };

export type CalcTier = 'dot' | 'far' | 'near';

export type CalcFlowData = {
  node: CalcNode;
  dataset: DatasetRef;
  mode: CalcViewMode;
  recipeBody: (recipeId: string) => Recipe | undefined;
  onSelectRecipe: (cardId: string, recipeId: string | null) => void;
  onSelectTagMember: (tagId: string, memberId: string) => void;
  onRequestPicker: (node: CalcNode) => void;
  onRequestMemberPicker: (node: CalcNode) => void;
  onRequestSupply: (node: CalcNode, input: number) => void;
  onSupplyInput: (
    cardId: string,
    inputIndex: number,
    recipeId: string | null,
    outputAmount?: number,
  ) => string | null;
  getRecipesForItem: (
    materialId: string,
    kind: CalcKind,
  ) => CalcRecipeSummary[];
  ensureMaterial: (materialId: string) => void;
  onAddCard: (
    materialId: string,
    kind: CalcKind,
    pos?: { x: number; y: number },
  ) => string;
  onOpenItem: (materialId: string, kind: CalcKind) => void;
  onRemoveCard: (cardId: string) => void;
  onMoveCard: (cardId: string, pos: { x: number; y: number }) => void;
  onCrafts: (cardId: string, crafts: number) => void;
  onWire: (from: string, to: string, input: number, out?: number) => void;
  onUnwire: (
    from: string,
    to: string,
    input: number,
    out?: number,
  ) => void;
  onRewire: (
    from: string,
    to: string,
    input: number,
    next: { from: string; to: string; input: number; out?: number },
  ) => void;
  onWireAmount: (
    from: string,
    to: string,
    input: number,
    amount: number | null,
  ) => void;
  recipeDefaults: Record<string, string>;
  onSetRecipeDefault: (materialId: string, recipeId: string | null) => void;
};

export type CalcFlowNode = Node<CalcFlowData, 'calcMaterial'>;
export type AnyCalcFlowNode = CalcFlowNode;

export function nodeSize(
  calc: CalcNode,
  ctx: { mode: CalcViewMode; recipeBody: (id: string) => Recipe | undefined },
): { w: number; h: number } {
  const margin =
    (calc.inputs.length ? PORT_IN : 0) + (calc.outputs.length ? PORT_IN : 0);
  if (ctx.mode === 'mini') {
    return { w: CALC_MINI_W + margin, h: CALC_MINI_TAG_H };
  }
  const body = calc.recipe ? ctx.recipeBody(calc.recipe.recipeId) : undefined;
  if (ctx.mode === 'detailed' && body?.w && body.h) {
    return {
      w: Math.max(CALC_NODE_W, body.w + 16) + margin,
      h: CALC_NODE_H + body.h + 6,
    };
  }
  return { w: CALC_NODE_W + margin, h: CALC_NODE_H };
}

export function cardsToFlow(
  nodes: CalcNode[],
  wires: readonly CalcWire[],
  data: Omit<CalcFlowData, 'node'>,
  flows?: readonly (number | undefined)[],
): { nodes: AnyCalcFlowNode[]; edges: Edge[] } {
  const flowNodes: AnyCalcFlowNode[] = nodes.map((node) => {
    const { w, h } = nodeSize(node, {
      mode: data.mode,
      recipeBody: data.recipeBody,
    });
    return {
      id: node.id,
      type: 'calcMaterial',
      position: { x: 0, y: 0 },
      width: w,
      height: h,
      data: { ...data, node },
    };
  });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: Edge[] = wires.flatMap((wire, index) => {
    const src = byId.get(wire.from);
    const dst = byId.get(wire.to);
    const input = dst?.inputs[wire.input];
    if (!src || !dst || !input || !input.wired) return [];
    const atIndex = src.outputs[wire.out ?? 0];
    const outIndex =
      atIndex && atIndex.id === input.id && atIndex.kind === input.kind
        ? (wire.out ?? 0)
        : src.outputs.findIndex(
            (o) => o.id === input.id && o.kind === input.kind,
          );
    if (outIndex < 0) return [];
    const mat = src.outputs[outIndex];
    return [
      {
        id: `wire:${wire.from}->${wire.to}:${wire.input}:${index}`,
        source: wire.from,
        sourceHandle: outIndex > 0 ? `out-${outIndex}` : 'out',
        target: wire.to,
        targetHandle: `in-${wire.input}`,
        type: 'calcEdge',
        className: 'calc-edge--wire',
        deletable: true,
        data: {
          wire,
          flow: flows?.[index],
          matId: mat?.id ?? input.id,
          matKind: mat?.kind ?? input.kind,
          dataset: data.dataset,
          onWireAmount: data.onWireAmount,
          onUnwire: data.onUnwire,
        },
      },
    ];
  });
  return { nodes: flowNodes, edges };
}

function sameCalcNode(a: CalcNode, b: CalcNode): boolean {
  return (
    a.id === b.id &&
    a.materialId === b.materialId &&
    a.kind === b.kind &&
    a.crafts === b.crafts &&
    a.produced === b.produced &&
    a.allocated === b.allocated &&
    a.remaining === b.remaining &&
    a.outputs.length === b.outputs.length &&
    a.outputs.every(
      (out, index) =>
        out.id === b.outputs[index]?.id &&
        out.kind === b.outputs[index]?.kind &&
        out.amount === b.outputs[index]?.amount &&
        out.allocated === b.outputs[index]?.allocated &&
        out.remaining === b.outputs[index]?.remaining,
    ) &&
    a.cycle === b.cycle &&
    a.products === b.products &&
    a.recipe?.recipeId === b.recipe?.recipeId &&
    a.recipe?.category === b.recipe?.category &&
    a.tagId === b.tagId &&
    a.loading === b.loading &&
    a.inputs.length === b.inputs.length &&
    a.inputs.every(
      (inp, index) =>
        inp.id === b.inputs[index]?.id &&
        inp.amount === b.inputs[index]?.amount &&
        inp.covered === b.inputs[index]?.covered &&
        inp.wired === b.inputs[index]?.wired &&
        inp.catalyst === b.inputs[index]?.catalyst,
    ) &&
    (a.members?.join() ?? '') === (b.members?.join() ?? '') &&
    a.availableRecipes.length === b.availableRecipes.length &&
    a.availableRecipes.every(
      (row, index) =>
        row.recipeId === b.availableRecipes[index]?.recipeId &&
        row.outputAmount === b.availableRecipes[index]?.outputAmount &&
        row.category === b.availableRecipes[index]?.category,
    )
  );
}

function sameFlowData(a: CalcFlowData, b: CalcFlowData): boolean {
  return (
    (a.node === b.node || sameCalcNode(a.node, b.node)) &&
    a.dataset === b.dataset &&
    a.mode === b.mode &&
    a.recipeBody === b.recipeBody &&
    a.onSelectRecipe === b.onSelectRecipe &&
    a.onSelectTagMember === b.onSelectTagMember &&
    a.onRequestPicker === b.onRequestPicker &&
    a.onRequestMemberPicker === b.onRequestMemberPicker &&
    a.onRequestSupply === b.onRequestSupply &&
    a.onSupplyInput === b.onSupplyInput &&
    a.getRecipesForItem === b.getRecipesForItem &&
    a.ensureMaterial === b.ensureMaterial &&
    a.onAddCard === b.onAddCard &&
    a.onOpenItem === b.onOpenItem &&
    a.onRemoveCard === b.onRemoveCard &&
    a.onMoveCard === b.onMoveCard &&
    a.onCrafts === b.onCrafts &&
    a.onWire === b.onWire &&
    a.onUnwire === b.onUnwire &&
    a.onRewire === b.onRewire &&
    a.onWireAmount === b.onWireAmount &&
    a.recipeDefaults === b.recipeDefaults &&
    a.onSetRecipeDefault === b.onSetRecipeDefault
  );
}

export function reconcileCalcNodes(
  prev: AnyCalcFlowNode[],
  next: AnyCalcFlowNode[],
): AnyCalcFlowNode[] {
  const withDelay = (
    node: AnyCalcFlowNode,
    order: number,
  ): AnyCalcFlowNode => ({
    ...node,
    style: {
      ...node.style,
      '--calc-delay': `${Math.min(order * 14, 300)}ms`,
    } as CalcFlowNode['style'],
  });

  if (!prev.length) return next.map((node, i) => withDelay(node, i + 1));
  const byId = new Map(prev.map((node) => [node.id, node]));
  let changed = next.length !== prev.length;
  let enters = 0;
  const out = next.map((node) => {
    const kept = byId.get(node.id);
    if (
      kept &&
      kept.position.x === node.position.x &&
      kept.position.y === node.position.y &&
      kept.width === node.width &&
      kept.height === node.height &&
      kept.className === node.className &&
      sameFlowData(kept.data, node.data)
    ) {
      return kept;
    }
    changed = true;
    if (!kept) {
      enters += 1;
      return withDelay(node, enters);
    }
    return node;
  });
  return changed ? out : prev;
}

export function reconcileCalcEdges(
  prev: Edge[],
  next: Edge[],
): Edge[] {
  if (!prev.length) return next;
  const byId = new Map(prev.map((edge) => [edge.id, edge]));
  let changed = next.length !== prev.length;
  const out = next.map((edge) => {
    const kept = byId.get(edge.id);

    if (
      kept &&
      kept.source === edge.source &&
      kept.target === edge.target &&
      kept.sourceHandle === edge.sourceHandle &&
      kept.targetHandle === edge.targetHandle &&
      kept.className === edge.className &&
      kept.data?.flow === edge.data?.flow &&
      (kept.data?.wire as CalcWire | undefined)?.amount ===
        (edge.data?.wire as CalcWire | undefined)?.amount &&
      ((kept.data?.points as FlowPoint[] | undefined)?.length ?? 0) ===
        ((edge.data?.points as FlowPoint[] | undefined)?.length ?? 0) &&
      (kept.data?.points as FlowPoint[] | undefined)?.every(
        (point, i) =>
          point.x ===
            (edge.data?.points as FlowPoint[] | undefined)?.[i]?.x &&
          point.y ===
            (edge.data?.points as FlowPoint[] | undefined)?.[i]?.y,
      ) !== false
    ) {
      return kept;
    }
    changed = true;
    return edge;
  });
  return changed ? out : prev;
}

