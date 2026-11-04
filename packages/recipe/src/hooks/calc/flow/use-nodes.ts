'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  useUpdateNodeInternals,
  type EdgeChange,
  type NodeChange,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import {
  type AnyCalcFlowNode,
  type CalcFlowData,
  type CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { createCircuitRouter } from '@terrafirmagreg-team/recipe/lib/calc/route';
import { useFlowWindow } from './use-window';
import { useMountedNodes } from './use-mount';
import { useEdgeEngage } from './use-engage';
import type { cardsToFlow } from '@terrafirmagreg-team/recipe/lib/calc/flow';

type Positioned = ReturnType<typeof cardsToFlow>;

export function useFlowNodes({
  positioned,
  shift,
  data,
  focusId,
  focusIdRef,
  rawFlow,
  mode,
  canvasId,
}: {
  positioned: Positioned;
  shift: { x: number; y: number } | null;
  data: Omit<
    CalcFlowData,
    'node' | 'mode' | 'onRequestPicker' | 'onRequestMemberPicker'
  >;
  focusId: string | null;
  focusIdRef: RefObject<string | null>;
  rawFlow: Positioned;
  mode: CalcViewMode;
  canvasId?: string;
}) {
  const [movedNodes, setMovedNodes] = useState<Map<
    string,
    { x: number; y: number }
  > | null>(null);

  const movedLiveRef = useRef<Map<string, { x: number; y: number }> | null>(
    null,
  );

  const pendingChangesRef = useRef<NodeChange<AnyCalcFlowNode>[]>([]);
  const changesFrameRef = useRef<number | null>(null);

  const dragIdsRef = useRef(new Set<string>());

  const [draggedIds, setDraggedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [routeCircuit] = useState(createCircuitRouter);
  const [liveMoved, setLiveMoved] = useState<Map<
    string,
    { x: number; y: number }
  > | null>(null);
  const placed = useMemo(
    () =>
      positioned.nodes.map((node) => {
        const position =
          liveMoved?.get(node.id) ??
          movedNodes?.get(node.id) ??
          node.position;
        return {
          ...node,
          position: shift
            ? { x: position.x + shift.x, y: position.y + shift.y }
            : position,
        };
      }),
    [positioned, movedNodes, liveMoved, shift],
  );

  const routes = useMemo(
    () =>
      routeCircuit(
        placed.map((node) => ({
          ...node,
          inputs: node.data?.node?.inputs?.length ?? 0,
          outputs: node.data?.node?.outputs?.length ?? 1,
        })),
        positioned.edges,
      ),
    [placed, positioned.edges, routeCircuit],
  );
  const mergedFlow = useMemo(() => {
    const nodes = placed.map((node) => ({
      ...node,
      className: node.id === focusId ? 'calc-node--focus' : undefined,
      data: { ...node.data, ...data },
    }));
    const edges = positioned.edges.map((edge) => {
      const points = routes?.get(edge.id);
      return points ? { ...edge, data: { ...edge.data, points } } : edge;
    });
    return { nodes, edges };
  }, [placed, positioned.edges, data, focusId, routes]);
  const { computed, extraRects } = useFlowWindow({
    mergedFlow,
    focusId,
    draggedIds,
  });
  const {
    nodes,
    edges,
    setState,
    clearMounts,
  } = useMountedNodes(computed);
  const applyEngaged = useEdgeEngage({
    computed,
    setState,
    rawFlow,
    focusIdRef,
  });
  const updateNodeInternals = useUpdateNodeInternals();
  const heightsRef = useRef<ReadonlyMap<string, number>>(new Map());
  useEffect(() => {
    heightsRef.current = new Map();
    movedLiveRef.current = null;
    dragIdsRef.current.clear();
    pendingChangesRef.current = [];
  }, [canvasId]);
  useEffect(() => {
    const prev = heightsRef.current;
    const next = new Map<string, number>();
    const changed: string[] = [];
    for (const node of nodes) {
      const h = node.height ?? 0;
      next.set(node.id, h);
      if (prev.has(node.id) && prev.get(node.id) !== h) changed.push(node.id);
    }
    heightsRef.current = next;
    if (changed.length) updateNodeInternals(changed);
  }, [nodes, updateNodeInternals]);

  const [prevLayout, setPrevLayout] = useState(mode);
  if (prevLayout !== mode) {
    setPrevLayout(mode);
    setMovedNodes(null);
    setDraggedIds(new Set());
  }
  useEffect(() => {
    movedLiveRef.current = null;
    dragIdsRef.current.clear();
    pendingChangesRef.current = [];
  }, [mode, canvasId]);

  const flushChanges = useCallback(() => {
    changesFrameRef.current = null;
    const batch = pendingChangesRef.current;
    pendingChangesRef.current = [];
    if (!batch.length) return;
    setState((prev) => ({
      ...prev,
      nodes: applyNodeChanges<AnyCalcFlowNode>(batch, prev.nodes),
    }));
    const live = movedLiveRef.current;
    const dragEnds: { id: string; x: number; y: number }[] = [];
    for (const change of batch) {
      if (change.type !== 'position' || change.dragging) continue;
      if (!change.position || !dragIdsRef.current.delete(change.id)) continue;
      dragEnds.push({ id: change.id, ...change.position });
      data.onMoveCard(change.id, change.position);
    }
    setLiveMoved(live?.size ? new Map(live) : null);
    if (!dragEnds.length) return;
    setDraggedIds(new Set(dragIdsRef.current));
    movedLiveRef.current = null;
    setMovedNodes((prev) => {
      const next = new Map(prev);
      if (live) for (const [pid, pos] of live) next.set(pid, pos);
      for (const end of dragEnds) next.set(end.id, { x: end.x, y: end.y });
      return next;
    });
  }, [setState, data]);
  useEffect(
    () => () => {
      if (changesFrameRef.current != null)
        cancelAnimationFrame(changesFrameRef.current);
    },
    [],
  );
  const onNodesChange = useCallback(
    (changes: NodeChange<AnyCalcFlowNode>[]) => {
      for (const change of changes) {
        if (change.type !== 'position' || !change.position) continue;
        if (change.dragging) {
          if (!dragIdsRef.current.has(change.id)) {
            dragIdsRef.current.add(change.id);
            setDraggedIds(new Set(dragIdsRef.current));
          }
          (movedLiveRef.current ??= new Map()).set(
            change.id,
            change.position,
          );
        }
      }
      pendingChangesRef.current.push(...changes);
      if (changesFrameRef.current == null) {
        changesFrameRef.current = requestAnimationFrame(flushChanges);
      }
    },
    [flushChanges],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setState((prev) => ({
        ...prev,
        edges: applyEdgeChanges(changes, prev.edges),
      }));
    },
    [setState],
  );

  const clearMoved = useCallback(() => {
    movedLiveRef.current = null;
    setMovedNodes(null);
  }, []);

  const resetNodes = useCallback(() => {
    setMovedNodes(null);
    clearMounts();
    setDraggedIds(new Set());
  }, [clearMounts]);

  return {
    nodes,
    edges,
    mergedFlow,
    extraRects,
    movedNodes,
    movedLiveRef,
    clearMoved,
    setMovedNodes,
    onNodesChange,
    onEdgesChange,
    applyEngaged,
    resetNodes,
  };
}

