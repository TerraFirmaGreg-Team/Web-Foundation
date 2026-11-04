import type { Node } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type { FlowPoint } from '@terrafirmagreg-team/ui/types/canvas';
import { portAnchorPoint } from '@terrafirmagreg-team/recipe/lib/calc/ports';

export const CELL = 8;

export const PAD = 6;

export type RouteNode = Pick<Node, 'id' | 'position'> & {
  width?: number;
  height?: number;
  inputs?: number;
  outputs?: number;
};

export type Rect = { x: number; y: number; w: number; h: number };

export const toRect = (node: RouteNode): Rect => ({
  x: node.position.x - (node.width ?? 0) / 2,
  y: node.position.y - (node.height ?? 0) / 2,
  w: node.width ?? 0,
  h: node.height ?? 0,
});

export function portAnchor(
  node: RouteNode,
  side: 'src' | 'tgt',
  index = 0,
): FlowPoint {
  return portAnchorPoint(
    node,
    side,
    index,
    side === 'tgt' ? (node.inputs ?? 1) : (node.outputs ?? 1),
  );
}

export const cellKey = (x: number, y: number) => (y + 32768) * 65536 + (x + 32768);
export const keyX = (key: number) => (key % 65536) - 32768;
export const keyY = (key: number) => Math.floor(key / 65536) - 32768;

export function zRoute(
  a: FlowPoint,
  b: FlowPoint,
  sa: FlowPoint,
  sb: FlowPoint,
): FlowPoint[] {
  const mid = (sa.x + sb.x) / 2;
  return [a, sa, { x: mid, y: sa.y }, { x: mid, y: sb.y }, sb, b];
}

