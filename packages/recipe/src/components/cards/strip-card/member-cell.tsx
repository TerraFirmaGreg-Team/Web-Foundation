'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import Link from 'next/link';
import { EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import {
  EntryTooltip,
  type EntryTooltipLevel,
} from '@terrafirmagreg-team/game/components/entry/tooltip';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import { entryHref } from '@terrafirmagreg-team/game/lib/entry/href';
import { loadStackDisplay } from '@terrafirmagreg-team/game/lib/entry/tooltip';
import { favoriteHover } from '@terrafirmagreg-team/recipe/lib/browser/favorite-hover';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { RecipeGridMember } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

const MEMBER_KIND: Record<string, ReferenceKind> = {
  fluid: 'fluid',
  entity: 'entity',
  block: 'block',
};

export function StripCardMember({
  member,
  dataset,
  lang,
  langMap,
  nav,
  x,
  y,
  pitch,
  interactive = true,
  tooltipLevel,
}: {
  member: RecipeGridMember;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  nav?: Pick<RecipeHrefOpts, 'tab' | 'search'>;
  x: number;
  y: number;
  pitch: number;
  interactive?: boolean;
  tooltipLevel?: EntryTooltipLevel;
}) {
  const kind = MEMBER_KIND[member.kind ?? 'item'] ?? 'item';
  const name = stackDisplayName(langMap, member.id);
  const checkKind = kind === 'item' || kind === 'fluid' ? kind : undefined;
  const stackPeek =
    dataset && checkKind
      ? loadStackDisplay.peek(dataset, member.id, checkKind)
      : undefined;
  const stackRes = useAsyncResult(
    dataset && checkKind && stackPeek === undefined
      ? async () => ({
          key: member.id,
          display: await loadStackDisplay(dataset, member.id, checkKind),
        })
      : false,
    [dataset, member.id, checkKind, stackPeek],
  );
  const missingItem =
    checkKind !== undefined &&
    stackPeek === undefined &&
    !stackRes.pending &&
    stackRes.value?.key === member.id &&
    stackRes.value.display === undefined;
  const badges: string[] = [];
  if (member.amount !== undefined && member.amount > 1) {
    badges.push(`×${member.amount}`);
  }
  if (member.chance !== undefined && member.chance < 1) {
    const percent = member.chance <= 1 ? member.chance * 100 : member.chance;
    badges.push(`${Number(percent.toFixed(1))}%`);
  }
  const inner = (
    <>
      <span className="pointer-events-none flex size-full items-center justify-center">
        <EntryIcon
          id={member.id}
          kind={kind}
          dataset={dataset}
          size={Math.max(8, pitch - 4)}
          missing="placeholder"
        />
      </span>
      {badges.length > 0 && (
        <span
          className="font-mc pointer-events-none absolute right-0 bottom-0 leading-none text-white [text-shadow:1px_1px_0_var(--color-mc-arrow)]"
          style={{ fontSize: pitch / 4 }}
        >
          {badges.join(' ')}
        </span>
      )}
    </>
  );
  const faceStyle = { left: x, top: y, width: pitch, height: pitch };
  const hover = {
    onMouseEnter: () => {
      favoriteHover.slot =
        kind === 'item' || kind === 'fluid'
          ? {
              kind: 'stack' as const,
              id: member.id,
              ...(kind === 'fluid' ? { ref: 'fluid' as const } : {}),
            }
          : undefined;
    },
    onMouseLeave: () => {
      favoriteHover.slot = undefined;
    },
  };
  if (!interactive) {
    return (
      <EntryTooltip
        dataset={dataset}
        id={member.id}
        name={name}
        kind={kind === 'fluid' ? 'fluid' : kind === 'entity' ? 'entity' : 'item'}
        lang={lang}
        langMap={langMap}
        level={tooltipLevel}
      >
        <span
          {...hover}
          aria-label={name}
          className="absolute block"
          style={faceStyle}
        >
          {inner}
        </span>
      </EntryTooltip>
    );
  }
  return (
    <EntryTooltip
      dataset={dataset}
      id={member.id}
      name={name}
      kind={kind === 'fluid' ? 'fluid' : kind === 'entity' ? 'entity' : 'item'}
      lang={lang}
      langMap={langMap}
      level={tooltipLevel}
    >
      <span
        {...hover}
        className="absolute block"
        style={faceStyle}
        aria-label={name}
      >
        {!missingItem ? (
          <Link
            href={entryHref(dataset, lang, { kind, id: member.id }, nav)}
            className="absolute inset-0 block"
          >
            {inner}
          </Link>
        ) : (
          <span className="absolute inset-0 block">{inner}</span>
        )}
      </span>
    </EntryTooltip>
  );
}

