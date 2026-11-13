'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Fragment, useState, type ReactElement, type ReactNode } from 'react';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import {
  isTagKind,
  tagKindOf,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { useModifierKeys } from '@terrafirmagreg-team/ui/hooks/use-modifier-keys';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { LazyTooltip } from '@terrafirmagreg-team/ui/components/blocks/tooltip/lazy';
import { stackTooltip } from '@terrafirmagreg-team/game/lib/entry/tooltip';
import {
  fetchTagMembers,
  peekTagMembers,
} from '@terrafirmagreg-team/game/lib/entry/icon-load';
import { formulaRuns } from '@terrafirmagreg-team/game/lib/entry/formula';
import { EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import { McText } from '@terrafirmagreg-team/game/components/entry/mc-text';
import { readableColor } from '@terrafirmagreg-team/ui/lib/color';
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
  if (!runs) return <McText text={text} surface="inverted" />;
  return (
    <>
      {runs.map((run, index) =>
        run.color ? (
          <span
            key={index}
            style={{ color: readableColor(run.color, 'inverted') }}
          >
            {run.text}
          </span>
        ) : (
          run.text
        ),
      )}
    </>
  );
}

function TagMemberIcons({
  dataset,
  id,
  kind,
}: {
  dataset: DatasetRef;
  id: string;
  kind: ReferenceKind;
}) {
  const memberKind = tagKindOf(kind);
  const tagId = id.startsWith('#') ? id.slice(1) : id;
  const peeked =
    dataset && memberKind
      ? peekTagMembers(dataset, tagId, memberKind)
      : undefined;
  const res = useAsyncResult(
    dataset && memberKind && peeked === undefined
      ? async () => ({
          members: await fetchTagMembers(dataset, tagId, memberKind),
        })
      : false,
    [dataset, tagId, memberKind, peeked],
  );
  const members = peeked ?? res.value?.members;
  if (!members?.length) return null;
  return (
    <div className="mt-1 flex max-w-48 flex-wrap gap-0.5">
      {members.map((member) => (
        <EntryIcon
          key={member}
          id={member}
          kind={memberKind}
          dataset={dataset}
          size={16}
          missing="hide"
        />
      ))}
    </div>
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
  subheader,
  footer,
  children,
}: {
  dataset: DatasetRef;
  id: string;
  name: string;
  kind?: ReferenceKind;

  lang?: string;
  langMap?: Record<string, string>;

  level?: EntryTooltipLevel;
  subheader?: ReactNode;
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

    const plainName = stripMcFormat(name).trim();
    const lines = extra.length
      ? [
          name,
          ...extra.filter(
            (line) => stripMcFormat(line).trim() !== plainName,
          ),
        ]
      : [name];
    const lastIsMod =
      lines.length > 1 && !lines[lines.length - 1].includes('§');

    return (
      <>
        {lines.map((line, index) => (
          <Fragment key={`${index}:${line}`}>
            <p
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
            {index === 0 ? subheader : null}
            {index === 0 && kind && isTagKind(kind) ? (
              <TagMemberIcons dataset={dataset} id={id} kind={kind} />
            ) : null}
          </Fragment>
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

