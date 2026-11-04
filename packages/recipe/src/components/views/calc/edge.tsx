'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  createChevronEdge,
  type ChevronEdgePathContext,
} from '@terrafirmagreg-team/ui/components/blocks/canvas/chevron-edge';
import { getSmoothStepPath } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import {
  roundedPolylinePath,
  svgPathToPoints,
} from '@terrafirmagreg-team/ui/lib/canvas/edge';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { useCalcSession } from '@terrafirmagreg-team/recipe/hooks/calc/use-session';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import type { FlowPoint } from '@terrafirmagreg-team/ui/types/canvas';
import type { CalcWire } from '@terrafirmagreg-team/recipe/types/calc';

function EdgeAmountLabel({ ctx }: { ctx: ChevronEdgePathContext }) {
  const wire = ctx.data?.wire as CalcWire | undefined;
  const flow = ctx.data?.flow as number | undefined;
  const matId = ctx.data?.matId as string | undefined;
  const matKind = ctx.data?.matKind as 'item' | 'fluid' | undefined;
  const dataset = ctx.data?.dataset as DatasetRef | undefined;
  const onWireAmount = ctx.data?.onWireAmount as
    | ((from: string, to: string, input: number, amount: number | null) => void)
    | undefined;
  const onUnwire = ctx.data?.onUnwire as
    | ((from: string, to: string, input: number, out?: number) => void)
    | undefined;
  const session = useCalcSession();
  const [edit, setEdit] = useState<string | null>(null);
  if (!wire || flow == null) return null;
  const cap = wire.amount;

  const commit = () => {
    if (edit == null) return;
    const raw = edit.trim();
    const value = raw === '' ? null : Math.max(0, Number(raw));
    onWireAmount?.(
      wire.from,
      wire.to,
      wire.input,
      value != null && Number.isFinite(value) ? value : null,
    );
    setEdit(null);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEdit(null);
  };

  if (edit != null) {
    return (
      <input
        autoFocus
        className="calc-edge-label__input"
        value={edit}
        onChange={(e) => setEdit(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  const matName =
    matId && session?.names
      ? recipeItemName(session.names, session.lang, matId)
      : matId;
  return (
    <button
      type="button"
      className="calc-edge-label"
      title={`${matName ?? ''} ${flow}${cap != null ? ` / ${cap}` : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (e.shiftKey) {
          onUnwire?.(wire.from, wire.to, wire.input, wire.out);
          return;
        }
        setEdit(cap != null ? String(cap) : '');
      }}
    >
      {matId && matKind && dataset ? (
        <Entry
          id={matId}
          kind={matKind}
          dataset={dataset}
          size="sm"
          href={false}
          tooltip={false}
        />
      ) : null}
      {matName ? (
        <span className="calc-edge-label__name">{matName}</span>
      ) : null}
      <span className="calc-edge-label__amount">
        ×{formatCount(flow, 1_000)}
        {cap != null ? `/${formatCount(cap, 1_000)}` : ''}
      </span>
      <span className="calc-edge-label__cut" aria-hidden>
        ×
      </span>
    </button>
  );
}

export const CalcEdge = createChevronEdge({
  renderLabel: (ctx) => <EdgeAmountLabel ctx={ctx} />,
  labelVisibility: 'hover',
  resolvePath: (ctx) => {
    const points = ctx.data?.points;
    if (Array.isArray(points) && points.length >= 2) {
      const pts = (points as FlowPoint[]).slice();
      const oldA = pts[0]!;
      const oldB = pts[pts.length - 1]!;
      pts[0] = { x: ctx.sourceX, y: ctx.sourceY };
      pts[pts.length - 1] = { x: ctx.targetX, y: ctx.targetY };
      if (pts.length > 2) {
        const s2 = pts[1]!;
        const sL = pts[pts.length - 2]!;
        if (s2.x === oldA.x) s2.x = ctx.sourceX;
        if (s2.y === oldA.y) s2.y = ctx.sourceY;
        if (sL.x === oldB.x) sL.x = ctx.targetX;
        if (sL.y === oldB.y) sL.y = ctx.targetY;
      }
      if (
        pts.length === 2 &&
        pts[0].x !== pts[1].x &&
        pts[0].y !== pts[1].y
      ) {
        const mid = (pts[0].x + pts[1].x) / 2;
        pts.splice(1, 0, { x: mid, y: pts[0].y }, { x: mid, y: pts[1].y });
      }
      return svgPathToPoints(roundedPolylinePath(pts, 12), 8);
    }
    return svgPathToPoints(
      getSmoothStepPath({
        sourceX: ctx.sourceX,
        sourceY: ctx.sourceY,
        sourcePosition: ctx.sourcePosition,
        targetX: ctx.targetX,
        targetY: ctx.targetY,
        targetPosition: ctx.targetPosition,
        borderRadius: 10,
      })[0],
    );
  },
});

