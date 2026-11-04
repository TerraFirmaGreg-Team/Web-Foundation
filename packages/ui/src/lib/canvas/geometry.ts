import { FLOW_MAX_ZOOM, FLOW_MIN_ZOOM } from '@terrafirmagreg-team/ui/lib/canvas/viewport';
import type {
  FlowContentBox,
  FlowRect,
  FlowSizedNode,
} from '@terrafirmagreg-team/ui/types/canvas';

const FIT_VIEW_PAD = 0.12;

export function flowContentBox(
  nodes: FlowSizedNode[],
  rects: FlowRect[] = [],
): FlowContentBox | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const node of nodes) {
    const halfW = (node.width ?? 0) / 2;
    const halfH = (node.height ?? 0) / 2;
    minX = Math.min(minX, node.position.x - halfW);
    minY = Math.min(minY, node.position.y - halfH);
    maxX = Math.max(maxX, node.position.x + halfW);
    maxY = Math.max(maxY, node.position.y + halfH);
  }
  for (const rect of rects) {
    minX = Math.min(minX, rect.x - rect.width / 2);
    minY = Math.min(minY, rect.y - rect.height / 2);
    maxX = Math.max(maxX, rect.x + rect.width / 2);
    maxY = Math.max(maxY, rect.y + rect.height / 2);
  }
  if (!Number.isFinite(minX)) return null;
  return {
    midX: (minX + maxX) / 2,
    midY: (minY + maxY) / 2,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

export function zoomToFitBox(
  box: { width: number; height: number },
  viewW: number,
  viewH: number,
  minZoom = FLOW_MIN_ZOOM,
  maxZoom = FLOW_MAX_ZOOM,
): number {
  const zoom = Math.min(
    (viewW * (1 - 2 * FIT_VIEW_PAD)) / box.width,
    (viewH * (1 - 2 * FIT_VIEW_PAD)) / box.height,
  );
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

