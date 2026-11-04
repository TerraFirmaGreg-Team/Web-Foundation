'use client';

import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import {
  Handle,
  Position,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  ContextMenu,
  ContextMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/context-menu';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type {
  CalcNode,
  CalcNodeInput,
  CalcOutput,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { PortContextMenu } from './menu';
import { formatPortCount, PortCount } from './ports';

interface CellProps {
  index: number;
  node: CalcNode;
  data: CalcFlowData;
  dataset: DatasetRef;
  lang: Lang;
  langMap?: Record<string, string>;
  names: Record<string, Record<string, string>>;
  connectable: boolean;
}

export function OutputCell({
  out,
  index,
  node,
  data,
  dataset,
  lang,
  langMap,
  names,
  connectable,
  onOpen,
}: CellProps & {
  out: CalcOutput;
  onOpen?: () => void;
}) {
  const name = recipeItemName(names, lang, out.id);
  const count = out.remaining;
  const qty = formatPortCount(count, out.kind);
  return (
    <ContextMenu>
      <ContextMenuTrigger
        onContextMenu={(e) => e.stopPropagation()}
        render={
          <Handle
            type="source"
            id={index === 0 ? 'out' : `out-${index}`}
            position={Position.Right}
            isConnectable={connectable}
            isConnectableEnd={connectable}
            className={cn(
              'calc-port calc-port--out',
              out.remaining < 0 && 'calc-port--over',
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (index === 0) onOpen?.();
            }}
          >
            <span className="calc-port-inner">
              <Entry
                id={out.id}
                kind={out.kind}
                dataset={dataset}
                lang={lang}
                langMap={langMap}
                name={`${name} ×${qty}`}
                size="sm"
                href={false}
                tooltip="adaptive"
              />
              <PortCount value={count} kind={out.kind} />
            </span>
          </Handle>
        }
      />
      <PortContextMenu
        data={data}
        node={node}
        out={index}
        id={out.id}
        kind={out.kind}
        dataset={dataset}
        lang={lang}
        langMap={langMap}
      />
    </ContextMenu>
  );
}

export function InputCell({
  inp,
  index,
  node,
  data,
  dataset,
  lang,
  langMap,
  names,
  connectable,
}: CellProps & {
  inp: CalcNodeInput;
}) {
  const id = inp.id;
  const name = id ? recipeItemName(names, lang, id) : (inp.tagId ?? '?');
  const uncovered = Math.max(0, inp.amount - inp.covered);
  const qty = formatPortCount(uncovered, inp.kind);
  const state = inp.wired
    ? uncovered <= 0
      ? 'full'
      : 'partial'
    : 'open';
  return (
    <ContextMenu>
      <ContextMenuTrigger
        onContextMenu={(e) => e.stopPropagation()}
        render={
          <Handle
            type="target"
            id={`in-${index}`}
            position={Position.Left}
            isConnectable={connectable}
            isConnectableEnd={connectable}
            className={cn(
              'calc-port',
              'calc-port--in',
              inp.catalyst && 'calc-port--cat',
              `calc-port--${state}`,
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (id) data.ensureMaterial(id);
              data.onRequestSupply(node, index);
            }}
          >
            <span className="calc-port-inner">
              {id ? (
                <Entry
                  id={id}
                  kind={inp.kind}
                  dataset={dataset}
                  lang={lang}
                  langMap={langMap}
                  name={`${name} ×${qty}`}
                  size="sm"
                  href={false}
                  tooltip="adaptive"
                />
              ) : (
                <span className="text-[9px]">?</span>
              )}
              <PortCount value={uncovered} kind={inp.kind} />
            </span>
          </Handle>
        }
      />
      {id ? (
        <PortContextMenu
          data={data}
          node={node}
          input={index}
          id={id}
          kind={inp.kind}
          dataset={dataset}
          lang={lang}
          langMap={langMap}
        />
      ) : null}
    </ContextMenu>
  );
}

