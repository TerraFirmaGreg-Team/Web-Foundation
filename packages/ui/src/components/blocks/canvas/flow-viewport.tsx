'use client';

import { useEffect, useRef } from 'react';
import {
  useReactFlow,
  useStore,
  useStoreApi,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { readStoredViewport } from '@terrafirmagreg-team/ui/lib/canvas/viewport';
import { zoomToFitBox } from '@terrafirmagreg-team/ui/lib/canvas/geometry';
import type { FlowContentBox } from '@terrafirmagreg-team/ui/types/canvas';

export function FlowViewport({
  storageKey,
  resetKey,
  selectedId,
  suppressPanRef,
  nodes,
  contentBox,
  viewSize,
  focusZoom,
  minZoom,
  maxZoom,
  restoreViewport = true,
  ready = true,
  onReady,
  initFocusId,
  userMovedRef,
}: {
  storageKey: string;
  resetKey: string;
  selectedId?: string | null;

  initFocusId?: string | null;
  suppressPanRef?: { current: string | null };

  userMovedRef?: { current: boolean };
  nodes: ReadonlyArray<{ id: string; position: { x: number; y: number } }>;
  contentBox: FlowContentBox | null;
  viewSize: { w: number; h: number };
  focusZoom: number;
  minZoom?: number;
  maxZoom?: number;
  restoreViewport?: boolean;
  ready?: boolean;
  onReady: () => void;
}) {
  const { setCenter, setViewport, getZoom } = useReactFlow();
  const storeApi = useStoreApi();
  const paneReady = useStore((s) => s.width > 0 && s.height > 0);
  const initRef = useRef<string | null>(null);
  const preInitRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const boxRef = useRef(contentBox);

  useEffect(() => {
    nodesRef.current = nodes;
    boxRef.current = contentBox;
  }, [nodes, contentBox]);

  const initKey = `${resetKey}:${ready ? 'ready' : 'warm'}`;

  const lastSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    lastSelectedRef.current = null;
    if (userMovedRef) userMovedRef.current = false;
  }, [resetKey, userMovedRef]);

  useEffect(() => {
    if (viewSize.w < 1 || viewSize.h < 1) return;
    if (!paneReady) return;
    if (!ready) {

      initRef.current = null;
    } else if (initRef.current === initKey) return;
    if (userMovedRef?.current) return;
    const box = boxRef.current ?? contentBox;
    const initNode = initFocusId
      ? nodesRef.current.find((entry) => entry.id === initFocusId)
      : undefined;
    if (!ready) {

      if (preInitRef.current === resetKey) return;
      if (initNode) {
        void setCenter(initNode.position.x, initNode.position.y, {
          zoom: focusZoom,
          duration: 0,
        });
      } else if (box) {
        void setCenter(box.midX, box.midY, {
          zoom: Math.min(
            zoomToFitBox(box, viewSize.w, viewSize.h, minZoom, maxZoom),
            1,
          ),
          duration: 0,
        });
      } else {
        return;
      }
      preInitRef.current = resetKey;
      return;
    }
    const cached = restoreViewport ? readStoredViewport(storageKey) : null;
    if (cached) {

      const px = -cached.x / cached.zoom;
      const py = -cached.y / cached.zoom;
      const pw = viewSize.w / cached.zoom;
      const ph = viewSize.h / cached.zoom;
      let hasContent = false;
      for (const node of storeApi.getState().nodeLookup.values()) {
        if (node.hidden) continue;
        const abs = node.internals.positionAbsolute;
        const w = node.measured?.width ?? node.width ?? 0;
        const h = node.measured?.height ?? node.height ?? 0;
        if (
          abs.x < px + pw &&
          abs.x + w > px &&
          abs.y < py + ph &&
          abs.y + h > py
        ) {
          hasContent = true;
          break;
        }
      }
      if (hasContent) {
        void setViewport(cached);
        initRef.current = initKey;
        onReady();
        return;
      }
    }
    const focusId =
      selectedId && selectedId !== suppressPanRef?.current
        ? selectedId
        : undefined;
    const tooWide =
      !!box &&
      Math.min(
        (viewSize.w * 0.76) / box.width,
        (viewSize.h * 0.76) / box.height,
      ) <
        focusZoom * 0.5;
    const wanted = focusId ?? (tooWide ? initFocusId : undefined);
    if (wanted) {
      const node = nodesRef.current.find((entry) => entry.id === wanted);
      if (node) {
        void setCenter(node.position.x, node.position.y, {
          zoom: focusZoom,
          duration: 0,
        });
        initRef.current = initKey;
        onReady();
        return;
      }
    }
    if (!box) return;
    void setCenter(box.midX, box.midY, {
      zoom: Math.min(
        zoomToFitBox(box, viewSize.w, viewSize.h, minZoom, maxZoom),
        focusZoom,
      ),
      duration: 0,
    });
    initRef.current = initKey;
    onReady();
  }, [
    contentBox,
    focusZoom,
    initKey,
    minZoom,
    maxZoom,
    initFocusId,
    nodes,
    onReady,
    paneReady,
    ready,
    resetKey,
    restoreViewport,
    selectedId,
    suppressPanRef,
    userMovedRef,
    setCenter,
    setViewport,
    storageKey,
    storeApi,
    viewSize,
  ]);

  const lastBoxRef = useRef<FlowContentBox | null>(null);
  useEffect(() => {
    if (contentBox === lastBoxRef.current) return;
    lastBoxRef.current = contentBox;
    if (!ready || !contentBox || viewSize.w < 1 || viewSize.h < 1) return;
    if (initRef.current !== initKey) return;
    const { transform } = storeApi.getState();
    const px = -transform[0] / transform[2];
    const py = -transform[1] / transform[2];
    const pw = viewSize.w / transform[2];
    const ph = viewSize.h / transform[2];
    for (const node of storeApi.getState().nodeLookup.values()) {
      if (node.hidden) continue;
      const abs = node.internals.positionAbsolute;
      const w = node.measured?.width ?? node.width ?? 0;
      const h = node.measured?.height ?? node.height ?? 0;
      if (
        abs.x < px + pw &&
        abs.x + w > px &&
        abs.y < py + ph &&
        abs.y + h > py
      )
        return;
    }
    void setCenter(contentBox.midX, contentBox.midY, {
      zoom: Math.min(
        zoomToFitBox(contentBox, viewSize.w, viewSize.h, minZoom, maxZoom),
        focusZoom,
      ),
      duration: 0,
    });
  }, [
    contentBox,
    focusZoom,
    initKey,
    minZoom,
    maxZoom,
    ready,
    setCenter,
    storeApi,
    viewSize,
  ]);

  useEffect(() => {
    if (selectedId === lastSelectedRef.current) return;
    lastSelectedRef.current = selectedId ?? null;
    if (initRef.current !== initKey || !selectedId) return;
    if (selectedId === suppressPanRef?.current) return;
    const node = nodesRef.current.find((entry) => entry.id === selectedId);
    if (!node) return;
    const { transform, width, height } = storeApi.getState();
    const px = -transform[0] / transform[2];
    const py = -transform[1] / transform[2];
    const pw = width / transform[2];
    const ph = height / transform[2];
    if (
      node.position.x > px + pw * 0.12 &&
      node.position.x < px + pw * 0.88 &&
      node.position.y > py + ph * 0.12 &&
      node.position.y < py + ph * 0.88
    ) {
      return;
    }
    void setCenter(node.position.x, node.position.y, {
      zoom: getZoom() || focusZoom,
      duration: 300,
    });
  }, [
    focusZoom,
    getZoom,
    initKey,
    selectedId,
    storeApi,
    suppressPanRef,
    setCenter,
  ]);

  return null;
}

