'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  createChevronEdge,
  type ChevronEdgePathContext,
} from '@terrafirmagreg-team/ui/components/blocks/canvas/chevron-edge';
import { getSmoothStepPath } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { svgPathToPoints } from '@terrafirmagreg-team/ui/lib/canvas/edge';
import { orthoPoints } from '@terrafirmagreg-team/recipe/lib/calc/route';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useCalcSession } from '@terrafirmagreg-team/recipe/hooks/calc/use-calc-session';
import { useCalcPipeEdit } from '@terrafirmagreg-team/recipe/hooks/calc/use-pipe-edit';
import { useShiftHeld } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-shift-held';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { Scissors } from 'lucide-react';
import type { FlowPoint } from '@terrafirmagreg-team/ui/types/canvas';
import type { CalcPipe } from '@terrafirmagreg-team/recipe/types/calc';

type PipeEdgeData = {
  pipe: CalcPipe;
  flow: number;
  matId?: string;
  matKind?: 'item' | 'fluid';
  dataset?: DatasetRef;
  onPipeLimit?: (
    from: string,
    to: string,
    input: number,
    amount: number | null,
  ) => void;
};

function fullAmount(n: number, lang?: string, kind?: 'item' | 'fluid') {
  const text = (v: number) => {
    try {
      return v.toLocaleString(lang?.replace('_', '-'), {
        maximumFractionDigits: 3,
      });
    } catch {
      return String(v);
    }
  };
  if (kind !== 'fluid') return text(n);
  return Math.abs(n) >= 1000 ? `${text(n / 1000)} B` : `${text(n)} mB`;
}

function EdgeLimitEditor({
  pipe,
  cap,
  matId,
  matKind,
  dataset,
  name,
  onPipeLimit,
}: PipeEdgeData & { cap: number | null | undefined; name?: string }) {
  const t = useTranslations();
  const { close } = useCalcPipeEdit();
  const [edit, setEdit] = useState(cap != null ? String(cap) : '');
  const commit = () => {
    const raw = edit.trim();
    const value = raw === '' ? null : Math.max(0, Number(raw));
    onPipeLimit?.(
      pipe.from,
      pipe.to,
      pipe.input,
      value != null && Number.isFinite(value) ? value : null,
    );
    close();
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') close();
  };
  return (
    <div className="calc-edge-edit" onClick={(e) => e.stopPropagation()}>
      <div className="calc-edge-edit__head">
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
        <span className="calc-edge-edit__name">{name}</span>
      </div>
      <label className="calc-edge-edit__row">
        <span className="calc-edge-edit__label">
          {t('Limit', { note: 'recipe.calc.pipe.limit' })}
        </span>
        <input
          autoFocus
          className="calc-edge-edit__input"
          value={edit}
          onChange={(e) => setEdit(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
        />
        {matKind === 'fluid' ? (
          <span className="calc-edge-edit__unit">mB</span>
        ) : null}
      </label>
    </div>
  );
}

function EdgeAmountLabel({ ctx }: { ctx: ChevronEdgePathContext }) {
  const session = useCalcSession();
  const { edgeId } = useCalcPipeEdit();
  const shiftHeld = useShiftHeld();
  const t = useTranslations();
  const pipe = ctx.data?.pipe as CalcPipe | undefined;
  const flow = ctx.data?.flow as number | undefined;
  const matId = ctx.data?.matId as string | undefined;
  const matKind = ctx.data?.matKind as 'item' | 'fluid' | undefined;
  const dataset = ctx.data?.dataset as DatasetRef | undefined;
  const onPipeLimit = ctx.data?.onPipeLimit as
    | PipeEdgeData['onPipeLimit']
    | undefined;
  const editing = edgeId === ctx.id;
  if (!editing && shiftHeld) {
    return (
      <div className="calc-edge-del">
        <Scissors size={8} strokeWidth={2.5} />
      </div>
    );
  }
  if (!pipe || flow == null) return null;
  const cap = pipe.amount;
  const matName =
    matId && session?.names
      ? recipeItemName(session.names, session.lang, matId)
      : matId;
  const full = (n: number) => fullAmount(n, session?.lang, matKind);
  const vertical =
    Math.abs(ctx.targetY - ctx.sourceY) >
    Math.abs(ctx.targetX - ctx.sourceX);
  if (editing) {
    return (
      <EdgeLimitEditor
        pipe={pipe}
        flow={flow}
        cap={cap}
        matId={matId}
        matKind={matKind}
        dataset={dataset}
        name={matName}
        onPipeLimit={onPipeLimit}
      />
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<div className="calc-edge-hotspot" />} />
      <TooltipContent
        side={vertical ? 'right' : 'top'}
        className="flex-col items-start gap-1"
      >
        <span className="flex items-center gap-1.5">
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
          {matName ? <span>{matName}</span> : null}
          <span className="tabular-nums">×{full(flow)}</span>
        </span>
        {cap != null ? (
          <span className="tabular-nums opacity-70">
            {t('Limit', { note: 'recipe.calc.pipe.limit' })}: {full(cap)}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function pinOrthoEnds(
  points: readonly FlowPoint[],
  s: FlowPoint,
  t: FlowPoint,
): FlowPoint[] {
  const pts = points.slice();
  pts[0] = s;
  pts[pts.length - 1] = t;
  if (pts.length === 2) {
    if (s.x !== t.x && s.y !== t.y) {
      const mid = (s.x + t.x) / 2;
      pts.splice(1, 0, { x: mid, y: s.y }, { x: mid, y: t.y });
    }
  } else if (pts.length === 3) {
    const m = pts[1]!;
    pts.splice(1, 1, { x: m.x, y: s.y }, { x: m.x, y: t.y });
  } else {
    pts[1] = { x: pts[1]!.x, y: s.y };
    pts[pts.length - 2] = { x: pts[pts.length - 2]!.x, y: t.y };
  }
  return orthoPoints(pts);
}

export const CalcEdge = createChevronEdge({
  casing: true,
  renderLabel: (ctx) => <EdgeAmountLabel ctx={ctx} />,
  labelVisibility: 'hover',
  resolvePath: (ctx) => {
    const points = ctx.data?.points;
    if (Array.isArray(points) && points.length >= 2) {
      return pinOrthoEnds(
        points as FlowPoint[],
        { x: ctx.sourceX, y: ctx.sourceY },
        { x: ctx.targetX, y: ctx.targetY },
      );
    }
    return orthoPoints(
      svgPathToPoints(
        getSmoothStepPath({
          sourceX: ctx.sourceX,
          sourceY: ctx.sourceY,
          sourcePosition: ctx.sourcePosition,
          targetX: ctx.targetX,
          targetY: ctx.targetY,
          targetPosition: ctx.targetPosition,
          borderRadius: 0,
        })[0],
      ),
    );
  },
});
