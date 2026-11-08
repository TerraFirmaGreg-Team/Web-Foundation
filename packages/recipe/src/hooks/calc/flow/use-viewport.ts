'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import { useReactFlow } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type {
  AnyCalcFlowNode,
  CalcFlowNode,
  CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';

export function useFlowViewport({
  mergedNodes,
  dataset,
  resetGen,
  treeReady,
  mode,
  applyFocus,
  focusSeqRef,
  focusRef,
  focusNodeId,
  onFocusedNode,
  focusId,
}: {
  mergedNodes: AnyCalcFlowNode[];
  dataset: DatasetRef;
  resetGen: number;
  treeReady: boolean;
  mode: CalcViewMode;
  applyFocus: (id: string | null) => void;
  focusSeqRef: RefObject<{ id: string; index: number } | null>;
  focusRef?: RefObject<((materialId: string) => void) | null>;
  focusNodeId?: string | null;
  onFocusedNode?: (id: string) => void;
  focusId: string | null;
}) {
  const { setCenter, getZoom } = useReactFlow();
  const userMovedRef = useRef(false);
  const storageKey = `calc:${dataset.id}`;

  const ready = treeReady;

  const centerOnNode = useCallback(
    (node: AnyCalcFlowNode) => {
      void setCenter(node.position.x, node.position.y, {
        zoom: Math.max(getZoom(), 1),
        duration: 300,
      });
    },
    [setCenter, getZoom],
  );

  useEffect(() => {
    const ref = focusRef;
    if (!ref) return;

    ref.current = (materialId: string) => {
      const wanted = materialId.replace(/\{.*$/, '');
      const matches = mergedNodes.filter(
        (entry) =>
          (entry.data as CalcFlowNode['data']).node?.materialId?.replace(
            /\{.*$/,
            '',
          ) === wanted,
      );
      if (!matches.length) return;
      const seq = focusSeqRef.current;
      const index =
        seq?.id === materialId ? (seq.index + 1) % matches.length : 0;
      focusSeqRef.current = { id: materialId, index };
      const node = matches[index]! as AnyCalcFlowNode;
      applyFocus(node.id);
      centerOnNode(node);
    };
    return () => {
      ref.current = null;
    };
  }, [focusRef, mergedNodes, applyFocus, centerOnNode, focusSeqRef]);

  useEffect(() => {
    if (!focusNodeId) return;
    const node = mergedNodes.find((entry) => entry.id === focusNodeId);
    if (!node) return;
    applyFocus(node.id);
    centerOnNode(node);
    onFocusedNode?.(focusNodeId);
  }, [mergedNodes, focusNodeId, applyFocus, centerOnNode, onFocusedNode]);

  const recenterRef = useRef(false);
  const viewSigRef = useRef(mode);
  useEffect(() => {
    if (viewSigRef.current === mode) return;
    viewSigRef.current = mode;
    recenterRef.current = true;
  }, [mode]);
  useEffect(() => {
    if (!ready || !recenterRef.current) return;
    const root = mergedNodes[0];
    if (root) centerOnNode(root as AnyCalcFlowNode);
    recenterRef.current = false;
  }, [ready, mergedNodes, centerOnNode]);

  const handleMoveStart = useCallback((event: unknown) => {
    if (event) userMovedRef.current = true;
  }, []);

  const viewportConfig = useMemo(
    () => ({
      storageKey,
      resetKey: `${storageKey}:${resetGen}`,
      selectedId: focusId,
      userMovedRef,
      initFocusId: null,
      focusZoom: 1,
      minZoom: 0.02,
      restoreViewport: false,
      ready,
    }),
    [storageKey, resetGen, focusId, ready],
  );
  const shellProps = useMemo(
    () => ({ 'data-ready': ready ? ('true' as const) : ('false' as const) }),
    [ready],
  );

  return {
    ready,
    centerOnNode,
    userMovedRef,
    handleMoveStart,
    viewportConfig,
    shellProps,
  };
}

