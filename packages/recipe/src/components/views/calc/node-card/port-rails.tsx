'use client';

import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useUpdateNodeInternals } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import {
  PORT_STEP,
  railSpans,
} from '@terrafirmagreg-team/recipe/lib/calc/ports';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { CalcNode } from '@terrafirmagreg-team/recipe/types/calc';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { GhostHandle } from './ports';
import { InputCell, OutputCell } from './port-cells';

function useRailWindow(total: number, nodeId: string, side: 'in' | 'out') {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [rows, setRows] = useState(0);
  const [offset, setOffset] = useState(0);
  const updateNodeInternals = useUpdateNodeInternals();
  useLayoutEffect(() => {
    if (!el) return;
    const measure = () =>
      setRows(Math.max(1, Math.floor(el.clientHeight / PORT_STEP)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  const paged = total > rows;
  const start = Math.min(offset, Math.max(0, total - 1));
  let end = total;
  if (paged) {
    end = start + rows;
    for (let i = 0; i < 3; i += 1) {
      const marks = (start > 0 ? 1 : 0) + (end < total ? 1 : 0);
      const next = Math.min(total, start + Math.max(1, rows - marks));
      if (next === end) break;
      end = next;
    }
  }
  const above = paged ? start : 0;
  const below = paged ? total - end : 0;
  const scroll = useCallback(
    (dir: number) =>
      setOffset((cur) => Math.min(Math.max(0, cur + dir), total - 1)),
    [total],
  );
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!paged) return;
      scroll(e.deltaY > 0 ? 1 : -1);
    },
    [paged, scroll],
  );
  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [nodeId, updateNodeInternals, start, end, rows, total]);
  useEffect(() => {
    railSpans.set(nodeId, {
      ...railSpans.get(nodeId),
      ...(side === 'in'
        ? { inStart: start, inRows: rows }
        : { outStart: start, outRows: rows }),
    });
  }, [nodeId, side, start, rows]);
  return { ref: setEl, start, end, above, below, paged, scroll, onWheel };
}

interface RailProps {
  node: CalcNode;
  data: CalcFlowData;
  dataset: DatasetRef;
  lang: Lang;
  langMap?: Record<string, string>;
  names: Record<string, Record<string, string>>;
  connectable?: boolean;
}

export function PortRailIn({
  node,
  data,
  dataset,
  lang,
  langMap,
  names,
  connectable = true,
}: RailProps) {
  const {
    ref,
    start,
    end,
    above,
    below,
    scroll,
    onWheel,
  } = useRailWindow(node.inputs.length, node.id, 'in');
  if (!node.inputs.length) return null;
  const slice = node.inputs.slice(start, end);
  return (
    <div
      ref={ref}
      className="calc-rail calc-rail--in nodrag nowheel"
      onWheel={onWheel}
    >
      {above > 0 ? (
        <button
          type="button"
          className="calc-port calc-port--more"
          onClick={(e) => {
            e.stopPropagation();
            scroll(-1);
          }}
        >
          {node.inputs.slice(0, above).map((inp, i) => (
            <GhostHandle key={i} type="target" id={`in-${i}`} />
          ))}
          <ChevronUp className="size-2.5" />
          <span>+{above}</span>
        </button>
      ) : null}
      {slice.map((inp, i) => (
        <InputCell
          key={start + i}
          inp={inp}
          index={start + i}
          node={node}
          data={data}
          dataset={dataset}
          lang={lang}
          langMap={langMap}
          names={names}
          connectable={connectable}
        />
      ))}
      {below > 0 ? (
        <button
          type="button"
          className="calc-port calc-port--more"
          onClick={(e) => {
            e.stopPropagation();
            scroll(1);
          }}
        >
          {node.inputs.slice(end).map((inp, i) => (
            <GhostHandle
              key={end + i}
              type="target"
              id={`in-${end + i}`}
            />
          ))}
          <ChevronDown className="size-2.5" />
          <span>+{below}</span>
        </button>
      ) : null}
    </div>
  );
}

export function PortRailOut({
  node,
  data,
  dataset,
  lang,
  langMap,
  names,
  connectable = true,
  onOpen,
}: RailProps & { onOpen?: () => void }) {
  const {
    ref,
    start,
    end,
    above,
    below,
    scroll,
    onWheel,
  } = useRailWindow(node.outputs.length, node.id, 'out');
  if (!node.outputs.length) return null;
  const slice = node.outputs.slice(start, end);
  return (
    <div
      ref={ref}
      className="calc-rail calc-rail--out nodrag nowheel"
      onWheel={onWheel}
    >
      {above > 0 ? (
        <button
          type="button"
          className="calc-port calc-port--more"
          onClick={(e) => {
            e.stopPropagation();
            scroll(-1);
          }}
        >
          {node.outputs.slice(0, above).map((out, i) => (
            <GhostHandle
              key={i}
              type="source"
              id={i === 0 ? 'out' : `out-${i}`}
            />
          ))}
          <ChevronUp className="size-2.5" />
          <span>+{above}</span>
        </button>
      ) : null}
      {slice.map((out, i) => (
        <OutputCell
          key={`${out.kind}:${out.id}:${start + i}`}
          out={out}
          index={start + i}
          node={node}
          data={data}
          dataset={dataset}
          lang={lang}
          langMap={langMap}
          names={names}
          connectable={connectable}
          onOpen={onOpen}
        />
      ))}
      {below > 0 ? (
        <button
          type="button"
          className="calc-port calc-port--more"
          onClick={(e) => {
            e.stopPropagation();
            scroll(1);
          }}
        >
          {node.outputs.slice(end).map((out, i) => (
            <GhostHandle
              key={end + i}
              type="source"
              id={`out-${end + i}`}
            />
          ))}
          <ChevronDown className="size-2.5" />
          <span>+{below}</span>
        </button>
      ) : null}
    </div>
  );
}

