'use client';

import type { ReactNode } from 'react';
import { Handle, Position } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import {
  formatCount,
  formatFluidAmount,
} from '@terrafirmagreg-team/ui/lib/utils/format';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { PORT_OUT } from '@terrafirmagreg-team/recipe/lib/calc/ports';
import type {
  CalcKind,
  CalcNode,
} from '@terrafirmagreg-team/recipe/types/calc';

export function formatPortCount(value: number, kind: CalcKind): string {
  if (kind === 'fluid') return formatFluidAmount(value);
  return formatCount(value, 1_000);
}

export function portAmountLine(
  value: number,
  kind: CalcKind,
  chance?: number,
): ReactNode {
  return (
    <p className="text-muted-foreground">
      {value.toLocaleString('en-US')}
      {kind === 'fluid' ? ' mB' : ''}
      {chance != null ? ` · ${Math.round(chance * 100)}%` : ''}
    </p>
  );
}

export function PortCount({
  value,
  kind,
  name,
}: {
  value: number;
  kind: CalcKind;
  name?: string;
}) {
  const text = formatPortCount(value, kind);
  return (
    <Hint
      label={
        <>
          <p>{name}</p>
          {portAmountLine(value, kind)}
        </>
      }
    >
      <span
        className="calc-port-count"
        data-len={text.length >= 5 ? 'xl' : text.length >= 4 ? 'l' : undefined}
      >
        {text}
      </span>
    </Hint>
  );
}

export function CardHandles({
  node,
  interactive,
}: {
  node: CalcNode;
  interactive: boolean;
}) {
  return (
    <>
      {node.outputs.map((out, index) => (
        <Handle
          key={`out-${index}`}
          type="source"
          id={index === 0 ? 'out' : `out-${index}`}
          position={Position.Right}
          isConnectable={interactive}
          className="calc-port calc-port--ghost"
          style={{ right: -PORT_OUT, top: '50%' }}
        />
      ))}
      {node.inputs.map((inp, index) => (
        <Handle
          key={index}
          type="target"
          id={`in-${index}`}
          position={Position.Left}
          isConnectable={interactive}
          className="calc-port calc-port--ghost"
          style={{ left: -PORT_OUT, top: '50%' }}
        />
      ))}
    </>
  );
}

export function GhostHandle({
  id,
  type,
}: {
  id: string;
  type: 'source' | 'target';
}) {
  return (
    <Handle
      type={type}
      id={id}
      position={type === 'source' ? Position.Right : Position.Left}
      isConnectable={false}
      className="calc-port calc-port--ghost"
      style={{ position: 'absolute', inset: 0, width: 'auto', height: 'auto' }}
    />
  );
}

