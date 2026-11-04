'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useState, type ReactElement, type ReactNode } from 'react';
import { useModifierKeys } from '@terrafirmagreg-team/ui/hooks/use-modifier-keys';
import { LazyTooltip } from '@terrafirmagreg-team/ui/components/blocks/tooltip/lazy';
import { stackTooltip } from '@terrafirmagreg-team/game/lib/entry/tooltip';
import { formulaRuns } from '@terrafirmagreg-team/game/lib/entry/formula';
import { McText } from '@terrafirmagreg-team/game/components/entry/mc-text';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

const ENCHANTED_TEXT_COLOR = 'var(--color-mc-enchant)';

export type EntryTooltipLevel =
  | 'compact'
  | 'extended'
  | 'full'
  | 'adaptive'
  | 'none';

function TooltipLine({ text }: { text: string }) {
  const runs = formulaRuns(stripMcFormat(text));
  if (!runs) return <McText text={text} />;
  return (
    <>
      {runs.map((run, index) =>
        run.color ? (
          <span key={index} style={{ color: run.color }}>
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
  );
}

export function EntryTooltip({
  dataset,
  id,
  name,
  kind,
  lang,
  langMap,
  level = 'full',
  footer,
  children,
}: {
  dataset: DatasetRef;
  id: string;
  name: string;
  kind?: 'item' | 'fluid' | 'entity';

  lang?: string;
  langMap?: Record<string, string>;

  level?: EntryTooltipLevel;
  footer?: ReactNode;
  children: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const held = useModifierKeys(open && (level === 'full' || level === 'adaptive'));

  const renderLines = (value?: {
    lines: string[];
    mods: Record<string, string[]>;
  }) => {
    const tooltip = value ?? { lines: [], mods: {} };
    const base = tooltip.lines;
    const modLine =
      base.length > 1 && !base[base.length - 1].includes('§')
        ? base[base.length - 1]
        : undefined;

    let extra: string[];
    if (level === 'compact') extra = modLine ? [modLine] : [];
    else if (level === 'extended') extra = base;
    else if (level === 'full') {
      const activeMod = held.shift
        ? 'shift'
        : held.ctrl
          ? 'ctrl'
          : held.alt
            ? 'alt'
            : null;
      extra = (activeMod ? tooltip.mods[activeMod] : undefined) ?? base;
    } else if (held.ctrl || held.alt)
      extra = (held.ctrl ? tooltip.mods.ctrl : tooltip.mods.alt) ?? base;
    else if (held.shift) extra = base;
    else extra = modLine ? [modLine] : [];

    const lines = extra.length
      ? [name, ...extra.filter((line) => line !== name)]
      : [name];
    const lastIsMod =
      lines.length > 1 && !lines[lines.length - 1].includes('§');

    return (
      <>
        {lines.map((line, index) => (
          <p
            key={`${index}:${line}`}
            className={
              index === 0
                ? 'font-medium'
                : lastIsMod && index === lines.length - 1
                  ? 'italic'
                  : 'text-muted-foreground'
            }
            style={
              lastIsMod && index === lines.length - 1
                ? { color: ENCHANTED_TEXT_COLOR }
                : undefined
            }
          >
            <TooltipLine text={line} />
          </p>
        ))}
        {footer}
      </>
    );
  };

  return (
    <LazyTooltip
      load={() => stackTooltip(dataset, id, lang, langMap, kind)}
      deps={[dataset, id, lang, langMap, kind]}
      onOpenChange={setOpen}
      trigger={children}
      contentClassName="flex-col items-start gap-0.5 p-3 text-sm break-words whitespace-pre-wrap"
    >
      {renderLines}
    </LazyTooltip>
  );
}

