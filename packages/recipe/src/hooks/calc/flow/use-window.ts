'use client';

import { useMemo } from 'react';
import { useStore, useStoreApi } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { flowContentBox } from '@terrafirmagreg-team/ui/lib/canvas/geometry';
import {
  CALC_NODE_H,
  CALC_NODE_W,
  type AnyCalcFlowNode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { Edge } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';

const CALC_VIRTUAL_MIN = 350;

export function useFlowWindow({
  mergedFlow,
  focusId,
  draggedIds,
}: {
  mergedFlow: { nodes: AnyCalcFlowNode[]; edges: Edge[] };
  focusId: string | null;
  draggedIds: ReadonlySet<string>;
}) {
  const storeApi = useStoreApi();
  const winKey = useStore((s) => {
    const [tx, ty, z] = s.transform;
    if (!s.width || !s.height || !z) return 'cold';
    const w = s.width / z;
    const h = s.height / z;
    return `${Math.floor(-tx / z / w)}:${Math.floor(-ty / z / h)}:${Math.round(z * 4)}`;
  });
  const fullBox = useMemo(
    () => flowContentBox(mergedFlow.nodes),
    [mergedFlow.nodes],
  );

  const extraRects = useMemo(
    () =>
      fullBox
        ? [
            {
              x: fullBox.midX,
              y: fullBox.midY,
              width: fullBox.width,
              height: fullBox.height,
            },
          ]
        : undefined,
    [fullBox],
  );
  const computed = useMemo(() => {
    if (mergedFlow.nodes.length <= CALC_VIRTUAL_MIN || winKey === 'cold') {
      return mergedFlow;
    }
    const s = storeApi.getState();
    const [tx, ty, z] = s.transform;
    if (!s.width || !s.height || !z) return mergedFlow;
    const vw = s.width / z;
    const vh = s.height / z;
    const left = -tx / z - vw;
    const right = -tx / z + 2 * vw;
    const top = -ty / z - vh;
    const bottom = -ty / z + 2 * vh;
    const nodes = mergedFlow.nodes.filter((node) => {
      if (draggedIds.has(node.id) || node.id === focusId) return true;
      const halfW = (node.width ?? CALC_NODE_W) / 2;
      const halfH = (node.height ?? CALC_NODE_H) / 2;
      return (
        node.position.x + halfW >= left &&
        node.position.x - halfW <= right &&
        node.position.y + halfH >= top &&
        node.position.y - halfH <= bottom
      );
    });
    if (nodes.length === mergedFlow.nodes.length) return mergedFlow;
    const ids = new Set(nodes.map((node) => node.id));
    return {
      nodes,
      edges: mergedFlow.edges.filter(
        (edge) => ids.has(edge.source) && ids.has(edge.target),
      ),
    };
  }, [mergedFlow, winKey, focusId, draggedIds, storeApi]);

  return { computed, extraRects };
}

