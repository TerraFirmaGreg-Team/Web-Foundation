'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import type { Edge } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type {
  AnyCalcFlowNode,
  cardsToFlow,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { ChevronEdgeHighlight } from '@terrafirmagreg-team/ui/types/canvas';
import type { MountedNodes } from './use-mount';

const CHAIN_NODE_MARK = 'calc-node--chain';
const DIM_NODE_MARK = 'calc-node--dim';

function stripMark(cls: string | undefined) {
  return cls
    ?.split(' ')
    .filter((c) => c !== CHAIN_NODE_MARK && c !== DIM_NODE_MARK)
    .join(' ');
}

export function useEdgeEngage({
  computed,
  setState,
  rawFlow,
  focusIdRef,
}: {
  computed: { nodes: AnyCalcFlowNode[]; edges: Edge[] };
  setState: Dispatch<SetStateAction<MountedNodes>>;
  rawFlow: ReturnType<typeof cardsToFlow>;
  focusIdRef: RefObject<string | null>;
}) {
  const engagedRef = useRef<string | null>(null);
  const adjacency = useMemo(() => {
    const downstream = new Map<string, Edge[]>();
    const upstream = new Map<string, Edge[]>();
    for (const edge of computed.edges) {
      downstream.set(edge.source, [
        ...(downstream.get(edge.source) ?? []),
        edge,
      ]);
      upstream.set(edge.target, [...(upstream.get(edge.target) ?? []), edge]);
    }
    return { downstream, upstream };
  }, [computed]);

  const applyEngaged = useCallback(
    (id: string | null) => {
      const prev = engagedRef.current;
      if (prev === id) return;
      engagedRef.current = id;

      const chainEdges = new Map<string, ChevronEdgeHighlight>();
      const chainNodes = new Set<string>();
      if (id) {
        chainNodes.add(id);
        const walk = (
          start: string,
          edgesOf: (n: string) => Edge[] | undefined,
          nextOf: (e: Edge) => string,
          mark: ChevronEdgeHighlight,
        ) => {
          const seen = new Set<string>([start]);
          const queue = [start];
          while (queue.length) {
            const nodeId = queue.shift()!;
            for (const edge of edgesOf(nodeId) ?? []) {
              chainEdges.set(edge.id, mark);
              const next = nextOf(edge);
              if (!seen.has(next)) {
                seen.add(next);
                chainNodes.add(next);
                queue.push(next);
              }
            }
          }
        };
        walk(id, (n) => adjacency.upstream.get(n), (e) => e.source, 'incoming');
        walk(id, (n) => adjacency.downstream.get(n), (e) => e.target, 'outgoing');
      }
      const active = chainEdges.size > 0;

      setState((current) => {
        let edgesChanged = false;
        const edges = current.edges.map((edge) => {
          const mark = active
            ? (chainEdges.get(edge.id) ?? 'dim')
            : undefined;
          if ((edge.data?.highlight ?? undefined) === mark) return edge;
          edgesChanged = true;
          return { ...edge, data: { ...edge.data, highlight: mark } };
        });
        let nodesChanged = false;
        const nodes = current.nodes.map((node) => {
          const base = stripMark(node.className);
          const cls = active
            ? chainNodes.has(node.id)
              ? `${base ?? ''} ${CHAIN_NODE_MARK}`.trim()
              : `${base ?? ''} ${DIM_NODE_MARK}`.trim()
            : base;
          if ((node.className ?? '') === (cls ?? '')) return node;
          nodesChanged = true;
          return { ...node, className: cls || undefined };
        });
        if (!edgesChanged && !nodesChanged) return current;
        return {
          ...current,
          edges: edgesChanged ? edges : current.edges,
          nodes: nodesChanged ? nodes : current.nodes,
        };
      });
    },
    [adjacency, setState],
  );
  useEffect(() => {
    engagedRef.current = null;
    focusIdRef.current = null;
  }, [rawFlow, focusIdRef]);
  return applyEngaged;
}

