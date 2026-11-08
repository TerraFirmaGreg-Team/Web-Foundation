'use client';

import {
  useCallback,
  type DragEvent,
  type MouseEvent,
} from 'react';
import {
  useReactFlow,
  type Connection,
  type Edge,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type {
  AnyCalcFlowNode,
  CalcFlowData,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type {
  CalcKind,
  CalcNode,
  CalcNodeInput,
  CalcOutput,
} from '@terrafirmagreg-team/recipe/types/calc';

export function useFlowHandlers({
  data,
  applyFocus,
  applyEngaged,
  centerOnNode,
  setPickerNode,
}: {
  data: Omit<
    CalcFlowData,
    'node' | 'mode' | 'onRequestPicker' | 'onRequestMemberPicker'
  >;
  applyFocus: (id: string | null) => void;
  applyEngaged: (id: string | null) => void;
  centerOnNode: (node: AnyCalcFlowNode) => void;
  setPickerNode: (node: CalcNode | null) => void;
}) {
  const { screenToFlowPosition, getNode } = useReactFlow();
  const slotAccepts = useCallback(
    (slot: CalcNodeInput | undefined, srcOut: CalcOutput | undefined) => {
      if (!slot || !srcOut?.id || slot.kind !== srcOut.kind) return false;
      if (slot.id === srcOut.id) return true;
      return !!slot.tagId && !!slot.members?.includes(srcOut.id);
    },
    [],
  );

  const handleNodeEnter = useCallback(
    (_event: MouseEvent, node: AnyCalcFlowNode) => applyEngaged(node.id),
    [applyEngaged],
  );
  const handleNodeLeave = useCallback(
    () => applyEngaged(null),
    [applyEngaged],
  );
  const handleNodeClick = useCallback(
    (_event: MouseEvent, node: AnyCalcFlowNode) => {
      applyFocus(node.id);
      centerOnNode(node);
    },
    [applyFocus, centerOnNode],
  );

  const handleNodeDoubleClick = useCallback(
    (event: MouseEvent, node: AnyCalcFlowNode) => {
      const el = event.target as HTMLElement | null;
      if (
        el?.closest(
          'button, a, input, [role="button"], .nodrag, .calc-port',
        )
      ) {
        return;
      }
      const target = (node.data as CalcFlowData).node;
      if (!target) return;

      if (target.recipe != null || target.availableRecipes.length > 0)
        setPickerNode(target);
    },
    [setPickerNode],
  );
  const handlePaneClick = useCallback(
    () => applyFocus(null),
    [applyFocus],
  );
  const handleDragOver = useCallback((event: DragEvent) => {
    if (event.dataTransfer.types.includes('application/x-tfg-calc')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);
  const handleDrop = useCallback(
    (event: DragEvent) => {
      const raw = event.dataTransfer.getData('application/x-tfg-calc');
      if (!raw) return;
      event.preventDefault();
      try {
        const parsed = JSON.parse(raw) as { id?: string; kind?: CalcKind };
        if (parsed.id && (parsed.kind === 'item' || parsed.kind === 'fluid')) {
          const pos = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          data.onAddCard(parsed.id, parsed.kind, pos);
        }
      } catch {}
    },
    [screenToFlowPosition, data],
  );

  const fitRecipeNodes = useCallback(
    (node: AnyCalcFlowNode) => node.data.node?.recipe != null,
    [],
  );

  const handleConnect = useCallback(
    (conn: Connection) => {
      const { source, target, sourceHandle, targetHandle } = conn;
      if (!source || !target || source === target) return;
      const input = Number(/^in-(\d+)$/.exec(targetHandle ?? '')?.[1] ?? -1);
      const outMatch = /^out(?:-(\d+))?$/.exec(sourceHandle ?? '');
      if (input < 0 || !outMatch) return;
      const out = Number(outMatch[1] ?? 0);
      const sNode = (getNode(source)?.data as CalcFlowData | undefined)?.node;
      const tNode = (getNode(target)?.data as CalcFlowData | undefined)?.node;
      const slot = tNode?.inputs[input];
      const srcOut = sNode?.outputs[out];
      if (!sNode || !tNode || !slotAccepts(slot, srcOut)) return;
      data.onWire(source, target, input, out);
    },
    [data, getNode, slotAccepts],
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge, conn: Connection) => {
      const wire = oldEdge.data?.wire as
        | { from: string; to: string; input: number; out?: number }
        | undefined;
      const input = Number(/^in-(\d+)$/.exec(conn.targetHandle ?? '')?.[1] ?? -1);
      const outMatch = /^out(?:-(\d+))?$/.exec(conn.sourceHandle ?? '');
      if (!wire || !conn.source || !conn.target || input < 0 || !outMatch)
        return;
      const out = Number(outMatch[1] ?? 0);
      if (conn.source === conn.target) return;
      const sNode = (getNode(conn.source)?.data as CalcFlowData | undefined)?.node;
      const tNode = (getNode(conn.target)?.data as CalcFlowData | undefined)?.node;
      const slot = tNode?.inputs[input];
      const srcOut = sNode?.outputs[out];
      if (!sNode || !tNode || !slotAccepts(slot, srcOut)) return;
      data.onRewire(wire.from, wire.to, wire.input, {
        from: conn.source,
        to: conn.target,
        input,
        out,
      });
    },
    [data, getNode, slotAccepts],
  );

  const handleEdgesDelete = useCallback(
    (edges: Edge[]) => {
      for (const edge of edges) {
        const wire = edge.data?.wire as
          | { from: string; to: string; input: number; out?: number }
          | undefined;
        if (wire) data.onUnwire(wire.from, wire.to, wire.input, wire.out);
      }
    },
    [data],
  );

  const handleEdgeClick = useCallback(
    (event: MouseEvent, edge: Edge) => {
      if (!event.shiftKey) return;
      const wire = edge.data?.wire as
        | { from: string; to: string; input: number; out?: number }
        | undefined;
      if (wire) data.onUnwire(wire.from, wire.to, wire.input, wire.out);
    },
    [data],
  );

  return {
    handleNodeEnter,
    handleNodeLeave,
    handleNodeClick,
    handleNodeDoubleClick,
    handlePaneClick,
    handleDragOver,
    handleDrop,
    handleConnect,
    handleReconnect,
    handleEdgesDelete,
    handleEdgeClick,
    fitRecipeNodes,
  };
}

