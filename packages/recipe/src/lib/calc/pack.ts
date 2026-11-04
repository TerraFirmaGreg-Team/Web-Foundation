import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type {
  CalcNode,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';
import {
  nodeSize,
  type CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';

export type CalcPackOptions = {
  mode: CalcViewMode;
  gaps: { x: number; y: number; goal: number };
  recipeBody: (recipeId: string) => Recipe | undefined;
};

export function layoutCards(
  nodes: CalcNode[],
  wires: readonly CalcWire[],
  options: CalcPackOptions,
): Map<string, { x: number; y: number }> {
  const { gaps } = options;
  const sizeOf = (node: CalcNode) =>
    nodeSize(node, {
      mode: options.mode,
      recipeBody: options.recipeBody,
    });
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const consumers = new Map<string, string[]>();
  const suppliers = new Map<string, string[]>();
  for (const wire of wires) {
    if (!byId.has(wire.from) || !byId.has(wire.to)) continue;
    consumers.set(wire.from, [...(consumers.get(wire.from) ?? []), wire.to]);
    suppliers.set(wire.to, [...(suppliers.get(wire.to) ?? []), wire.from]);
  }

  const depth = new Map<string, number>();
  const visit = (id: string, trail: Set<string>): number => {
    const hit = depth.get(id);
    if (hit !== undefined) return hit;
    if (trail.has(id)) return 0;
    trail.add(id);
    let d = 0;
    for (const next of suppliers.get(id) ?? []) {
      d = Math.max(d, visit(next, trail) + 1);
    }
    trail.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const node of nodes) visit(node.id, new Set());

  const lanes = new Map<number, CalcNode[]>();
  for (const node of nodes) {
    const d = depth.get(node.id) ?? 0;
    lanes.set(d, [...(lanes.get(d) ?? []), node]);
  }
  const positions = new Map<string, { x: number; y: number }>();
  let mainCursor = 0;
  const ordered = [...lanes.entries()].sort(([a], [b]) => a - b);
  for (const [, lane] of ordered) {
    let cross = 0;
    let laneMain = 0;
    for (const node of lane) {
      const { w, h } = sizeOf(node);
      positions.set(node.id, {
        x: mainCursor + w / 2,
        y: cross + h / 2,
      });
      cross += h + gaps.x;
      laneMain = Math.max(laneMain, w);
    }
    mainCursor += laneMain + gaps.y + gaps.goal;
  }
  return positions;
}

