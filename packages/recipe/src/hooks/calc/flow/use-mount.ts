'use client';

import { useEffect, useRef, useState } from 'react';
import {
  reconcileCalcEdges,
  reconcileCalcNodes,
  type AnyCalcFlowNode,
  type CalcFlowNode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { Edge } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';

export type MountedNodes = {
  raw: { nodes: AnyCalcFlowNode[]; edges: Edge[] };
  nodes: AnyCalcFlowNode[];
  edges: Edge[];
};

export function useMountedNodes(computed: {
  nodes: AnyCalcFlowNode[];
  edges: Edge[];
}) {
  const [pendingMounts, setPendingMounts] = useState<AnyCalcFlowNode[]>([]);
  const computedRef = useRef(computed);
  const [state, setState] = useState<MountedNodes>(() => ({
    raw: computed,

    nodes: reconcileCalcNodes([], computed.nodes),
    edges: computed.edges,
  }));
  useEffect(() => {
    computedRef.current = computed;
  });
  if (state.raw !== computed) {
    const prevIds = new Set(state.nodes.map((n) => n.id));
    const fresh = computed.nodes.filter((n) => !prevIds.has(n.id));
    const first = new Set(fresh.slice(0, 200).map((n) => n.id));
    const rest = fresh.slice(200);
    if (rest.length !== pendingMounts.length || rest.length === 0) {
      setPendingMounts(rest);
    }
    setState({
      raw: computed,
      nodes: reconcileCalcNodes(
        state.nodes,
        computed.nodes.filter(
          (n) => prevIds.has(n.id) || first.has(n.id),
        ),
      ),
      edges: reconcileCalcEdges(state.edges, computed.edges),
    });
  }
  useEffect(() => {
    if (!pendingMounts.length) return;
    const raf = requestAnimationFrame(() => {
      const alive = new Set(
        computedRef.current.nodes.map((n) => n.id),
      );
      const slice: AnyCalcFlowNode[] = [];
      const rest: AnyCalcFlowNode[] = [];
      const start = performance.now();
      for (const node of pendingMounts) {
        if (!alive.has(node.id)) continue;
        if (slice.length >= 24 && performance.now() - start > 24) {
          rest.push(node);
        } else {
          slice.push(node);
        }
      }
      setPendingMounts(rest);
      if (!slice.length) return;
      setState((prev) => {
        const have = new Set(prev.nodes.map((n) => n.id));
        const add = slice
          .filter((n) => !have.has(n.id))
          .map((node, i) => ({
            ...node,
            style: {
              ...node.style,
              '--calc-delay': `${Math.min((i + 1) * 14, 300)}ms`,
            } as CalcFlowNode['style'],
          }));
        return add.length
          ? { ...prev, nodes: [...prev.nodes, ...add] }
          : prev;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pendingMounts]);

  return {
    nodes: state.nodes,
    edges: state.edges,
    setState,
    clearMounts: () => setPendingMounts([]),
  };
}

