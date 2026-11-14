'use client';

import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import {
  EdgeLabelRenderer,
  useInternalNode,
  useStore,
  type EdgeProps,
  type InternalNode,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import {
  CHEVRON_GLYPH,
  chevronHighlightClass,
  chevronTicksAlongPath,
  nearestPointOnPolyline,
} from '@terrafirmagreg-team/ui/lib/canvas/edge';
import type {
  ChevronEdgeHighlight,
  FlowPoint,
} from '@terrafirmagreg-team/ui/types/canvas';

export type ChevronEdgePathContext = EdgeProps & {
  sourceNode: InternalNode;
  targetNode: InternalNode;
};

type ChevronEdgeResolvers = {
  resolveCenter?: (node: InternalNode) => FlowPoint;
  resolveBorder?: (node: InternalNode, toward: FlowPoint) => FlowPoint;
  resolvePath?: (ctx: ChevronEdgePathContext) => FlowPoint[];
  renderLabel?: (ctx: ChevronEdgePathContext) => ReactNode;
  labelVisibility?: 'always' | 'hover';
  className?: string;
};

function pathMidpoint(points: readonly FlowPoint[]): FlowPoint {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(
      points[i]!.x - points[i - 1]!.x,
      points[i]!.y - points[i - 1]!.y,
    );
  }
  const half = total / 2;
  let acc = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + len >= half && len > 0) {
      const t = (half - acc) / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    acc += len;
  }
  return points[points.length - 1]!;
}

const CHEVRON_TICK_MIN_ZOOM = 0.25;

export function createChevronEdge({
  resolveCenter,
  resolveBorder,
  resolvePath,
  renderLabel,
  labelVisibility = 'always',
  className,
}: ChevronEdgeResolvers): FC<EdgeProps> {
  return memo(function ChevronEdge(props: EdgeProps) {
    const { source, target, data } = props;
    const [hover, setHover] = useState(false);
    const [hoverPt, setHoverPt] = useState<FlowPoint | null>(null);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const enter = useCallback(() => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setHover(true);
    }, []);
    const leave = useCallback(() => {
      hoverTimer.current = setTimeout(() => {
        setHover(false);
        setHoverPt(null);
      }, 120);
    }, []);
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);
    const farZoom = useStore(
      (state) => state.transform[2] < CHEVRON_TICK_MIN_ZOOM,
    );
    const tx = useStore((state) => state.transform[0]);
    const ty = useStore((state) => state.transform[1]);
    const tz = useStore((state) => state.transform[2]);
    const sAbs = sourceNode?.internals.positionAbsolute;
    const tAbs = targetNode?.internals.positionAbsolute;
    const sSize = sourceNode?.measured;
    const tSize = targetNode?.measured;
    const {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    } = props;

    const points = useMemo(() => {
      if (!sAbs || !tAbs || !sourceNode || !targetNode) return null;
      return resolvePath
        ? resolvePath({ ...props, sourceNode, targetNode })
        : resolveCenter && resolveBorder
          ? [
              resolveBorder(sourceNode, resolveCenter(targetNode)),
              resolveBorder(targetNode, resolveCenter(sourceNode)),
            ]
          : [
              { x: sourceX, y: sourceY },
              { x: targetX, y: targetY },
            ];
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      data,
      sAbs?.x,
      sAbs?.y,
      sSize?.width,
      sSize?.height,
      tAbs?.x,
      tAbs?.y,
      tSize?.width,
      tSize?.height,
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    ]);
    const ticks = useMemo(
      () =>
        points && !farZoom
          ? chevronTicksAlongPath(points)
          : { offsets: [], total: 0 },
      [points, farZoom],
    );
    const highlight = data?.highlight as ChevronEdgeHighlight;
    const mid = useMemo(
      () => (points ? pathMidpoint(points) : null),
      [points],
    );
    const move = useCallback(
      (e: ReactMouseEvent<Element>) => {
        if (!points || tz === 0) return;
        const pane = e.currentTarget.closest('.react-flow');
        if (!pane) return;
        const rect = pane.getBoundingClientRect();
        const p = {
          x: (e.clientX - rect.left - tx) / tz,
          y: (e.clientY - rect.top - ty) / tz,
        };
        setHoverPt(nearestPointOnPolyline(points, p));
      },
      [points, tx, ty, tz],
    );
    if (data?.hidden === true) return null;
    if (!points || points.length < 2 || !mid) return null;
    const base = `M${points[0]!.x} ${points[0]!.y}${points
      .slice(1)
      .map((p) => `L${p.x} ${p.y}`)
      .join('')}`;
    const hoverTrack =
      labelVisibility === 'hover'
        ? { onMouseEnter: enter, onMouseLeave: leave, onMouseMove: move }
        : {};
    const labelOn =
      labelVisibility !== 'hover' || hover || props.selected === true;
    const labelAt = hoverPt ?? mid;
    return (
      <>
      <g
        className={cn(
          'chevron-edge',
          className,
          chevronHighlightClass(highlight),
        )}
        {...hoverTrack}
      >
        <path
          className="chevron-edge__interaction"
          d={base}
          fill="none"
          stroke="transparent"
          strokeWidth={props.interactionWidth ?? 20}
        />
        <path
          className="chevron-edge__stroke chevron-edge__base"
          d={base}
          aria-hidden="true"
        />
        <g className="chevron-edge__ticks" aria-hidden="true">
          {ticks.offsets.map((offset) => (
            <path
              key={offset}
              className="chevron-edge__stroke chevron-edge__stroke--main chevron-edge__tick"
              d={CHEVRON_GLYPH}
              style={{
                offsetPath: `path("${base}")`,
                ['--chevron-o' as string]: `${offset}px`,
              }}
            />
          ))}
        </g>
      </g>
      {renderLabel && labelOn ? (
        <EdgeLabelRenderer>
          <div
            className="chevron-edge__label nodrag nopan"
            {...hoverTrack}
            style={{
              transform: `translate(-50%, -50%) translate(${labelAt.x}px, ${labelAt.y}px)`,
            }}
          >
            {renderLabel({
              ...props,
              sourceNode: sourceNode!,
              targetNode: targetNode!,
            })}
          </div>
        </EdgeLabelRenderer>
      ) : null}
      </>
    );
  });
}

