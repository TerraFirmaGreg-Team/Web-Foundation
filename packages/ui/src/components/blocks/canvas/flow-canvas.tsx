'use client';

import {
  useCallback,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import {
  Background,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type ReactFlowProps,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { useTheme } from 'next-themes';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';
import { useFlowViewportPersist } from '@terrafirmagreg-team/ui/hooks/canvas/use-flow-viewport-persist';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import {
  flowContentBox,
  zoomToFitBox,
} from '@terrafirmagreg-team/ui/lib/canvas/geometry';
import {
  FLOW_MAX_ZOOM,
  FLOW_MIN_ZOOM,
} from '@terrafirmagreg-team/ui/lib/canvas/viewport';
import { FlowViewport } from '@terrafirmagreg-team/ui/components/blocks/canvas/flow-viewport';
import type {
  FlowCanvasViewport,
  FlowRect,
} from '@terrafirmagreg-team/ui/types/canvas';

export type FlowCanvasFit = { onFit: () => void };

export type FlowCanvasProps<
  N extends Node = Node,
  E extends Edge = Edge,
> = Omit<ReactFlowProps<N, E>, 'nodes' | 'children'> & {
  nodes: N[];
  viewportConfig: FlowCanvasViewport;

  extraRects?: FlowRect[];

  fitNodes?: (node: N) => boolean;
  backgroundGap?: number;
  className?: string;
  shellProps?: ComponentProps<'div'> &
    Record<`data-${string}`, unknown>;

  children?: ReactNode | ((fit: FlowCanvasFit) => ReactNode);
};

export function FlowCanvas<N extends Node = Node, E extends Edge = Edge>({
  nodes,
  viewportConfig,
  extraRects,
  fitNodes,
  backgroundGap = 16,
  className,
  shellProps,
  children,
  onMoveEnd,
  ...flowProps
}: FlowCanvasProps<N, E>) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewSize = useElementSize(canvasRef);
  const { setCenter } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const { markReady, persist } = useFlowViewportPersist(
    viewportConfig.storageKey,
    viewportConfig.resetKey,
  );
  const contentBox = useMemo(
    () => flowContentBox(nodes, extraRects),
    [nodes, extraRects],
  );
  const scoped = useMemo(
    () => (fitNodes ? nodes.filter(fitNodes) : nodes),
    [nodes, fitNodes],
  );
  const fitBox = useMemo(() => {
    if (!fitNodes || !scoped.length) return contentBox;
    return flowContentBox(scoped, extraRects);
  }, [scoped, extraRects, fitNodes, contentBox]);
  const { focusZoom = 1, persist: _persist, ...viewportRest } = viewportConfig;
  const onFit = useCallback(() => {
    if (!fitBox || viewSize.w < 1 || viewSize.h < 1) return;
    const fitZoom = zoomToFitBox(
      fitBox,
      viewSize.w,
      viewSize.h,
      flowProps.minZoom,
      flowProps.maxZoom,
    );

    const pool = scoped.length ? scoped : nodes;
    let anchor: { x: number; y: number } = {
      x: fitBox.midX,
      y: fitBox.midY,
    };
    let best = Infinity;
    for (const node of pool) {
      const dx = node.position.x - fitBox.midX;
      const dy = node.position.y - fitBox.midY;
      const dist = dx * dx + dy * dy;
      if (dist < best) {
        best = dist;
        anchor = node.position;
      }
    }

    void setCenter(anchor.x, anchor.y, {
      zoom: Math.max(fitZoom, focusZoom * 0.3),
      duration: 200,
    });
  }, [
    fitBox,
    scoped,
    nodes,
    setCenter,
    viewSize,
    flowProps.minZoom,
    flowProps.maxZoom,
    focusZoom,
  ]);
  const handleMoveEnd = useCallback<
    NonNullable<ReactFlowProps<N, E>['onMoveEnd']>
  >(
    (event, vp) => {
      if (viewportConfig.persist) persist(vp);
      onMoveEnd?.(event, vp);
    },
    [viewportConfig.persist, persist, onMoveEnd],
  );

  return (
    <div
      ref={canvasRef}
      suppressHydrationWarning
      {...shellProps}
      className={cn(
        'flex-1 min-h-0 h-full not-prose relative w-full overflow-hidden',
        className,
        shellProps?.className,
      )}
    >
      {viewSize.w > 0 && viewSize.h > 0 ? (
        <ReactFlow<N, E>
          nodes={nodes}
          nodeOrigin={[0.5, 0.5]}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnPinch
          minZoom={FLOW_MIN_ZOOM}
          maxZoom={FLOW_MAX_ZOOM}
          proOptions={{ hideAttribution: true }}
          colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
          className="h-full bg-card"
          onMoveEnd={handleMoveEnd}
          {...flowProps}
        >
          <Background gap={backgroundGap} size={1} />
          {typeof children === 'function' ? children({ onFit }) : children}
          <FlowViewport
            {...viewportRest}
            nodes={nodes}
            contentBox={contentBox}
            viewSize={viewSize}
            focusZoom={focusZoom}
            onReady={markReady}
          />
        </ReactFlow>
      ) : null}
    </div>
  );
}

