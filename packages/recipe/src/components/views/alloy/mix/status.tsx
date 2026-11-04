'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { Badge } from '@terrafirmagreg-team/ui/components/ui/badge';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import {
  ArrowUpToLine,
  Check,
  Copy,
  Magnet,
  RotateCcw,
} from 'lucide-react';
import type { MixState } from '@terrafirmagreg-team/recipe/hooks/alloy/use-mix-state';

export function MixStatus({ state }: { state: MixState }) {
  const t = useTranslations();
  const {
    mix,
    fix,
    needsSnap,
    snapped,
    factor,
    totalNumber,
    unit,
    ratioMix,
    output,
    unitLabel,
    format,
    copyText,
    trim,
    setInputs,
    fill,
  } = state;
  const { checked: copied, onClick: onCopy } = useCopyButton(() =>
    navigator.clipboard.writeText(copyText),
  );

  return (
    <div
      aria-live="polite"
      className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-3 py-2"
    >
      <Badge variant={mix.valid ? 'default' : 'destructive'}>
        {mix.valid ? t('Valid alloy', { note: 'recipe.alloy.valid' }) : t('Outside allowed ranges', { note: 'recipe.alloy.invalid' })}
      </Badge>
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          {t('Total', { note: 'recipe.alloy.total_in' })}: {format(mix.total)} {unitLabel}
        </span>
        <span className="flex items-center gap-1.5 text-sm tabular-nums font-medium">
          <span className="text-muted-foreground">→</span>
          {output ? (
            <Entry
              id={output.id}
              kind={output.kind === 'fluid' ? 'fluid' : 'item'}
              size="sm"
              labeled
              href={false}
              tooltip={false}
            />
          ) : (
            t('Alloy', { note: 'recipe.alloy.result' })
          )}
          <span className="font-normal text-muted-foreground">
            {format(mix.output)} {unitLabel}
          </span>
        </span>
      </span>
      <span className="ms-auto flex flex-wrap items-center gap-2">
        <IconButton
          label={`${t('Top up to minimum', { note: 'recipe.alloy.fix' })}: ${t('Add just enough metal to bring every share into its range', { note: 'recipe.alloy.hint.fix' })}`}
          disabled={!fix || mix.valid}
          onClick={() =>
            fix &&
            setInputs((prev) =>
              prev.map((value, i) => trim((Number(value) || 0) + fix[i])),
            )
          }
        >
          <ArrowUpToLine className="size-3.5" />
        </IconButton>
        {needsSnap ? (
          <IconButton
            label={`${t('Snap to whole ingots', { note: 'recipe.alloy.snap_ingots' })}: ${t('Round each metal to whole ingots, staying inside the ranges', { note: 'recipe.alloy.hint.snap' })}`}
            disabled={!snapped}
            onClick={() =>
              snapped && setInputs(snapped.map((value) => trim(value / factor)))
            }
          >
            <Magnet className="size-3.5" />
          </IconButton>
        ) : (
          <span className="size-7 shrink-0" aria-hidden />
        )}
        <IconButton
          label={`${t('Reset to recipe ratio', { note: 'recipe.alloy.reset' })}: ${t('Restore the recipe-ratio mix', { note: 'recipe.alloy.hint.reset' })}`}
          onClick={() =>
            fill(
              Number.isFinite(totalNumber)
                ? totalNumber
                : unit === 'ingot'
                  ? (ratioMix?.total ?? 10)
                  : 144,
            )
          }
        >
          <RotateCcw className="size-3.5" />
        </IconButton>
        <IconButton label={t('Copy the mix as text', { note: 'recipe.alloy.copy_mix' })} onClick={onCopy}>
          {copied ? (
            <Check className="size-3.5 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </IconButton>
      </span>
    </div>
  );
}

