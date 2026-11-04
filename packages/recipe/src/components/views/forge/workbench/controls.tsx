'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Input } from '@terrafirmagreg-team/ui/components/ui/input';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { Check, Copy, RotateCcw, Undo2, Wand2 } from 'lucide-react';
import { forgeActionLabel } from '@terrafirmagreg-team/recipe/lib/forge/actions';
import type { ForgeState } from '@terrafirmagreg-team/recipe/hooks/forge/use-forge-state';

export function WorkbenchControls({
  state,
  rulesSupported,
  langMap,
}: {
  state: ForgeState;
  rulesSupported: boolean;
  langMap: Record<string, string>;
}) {
  const t = useTranslations();
  const { startInput, targetInput, applied, steps, target, solving } = state;
  const { checked: copied, onClick: copy } = useCopyButton(() =>
    navigator.clipboard.writeText(
      steps
        .map(
          (step, i) =>
            `${i + 1}. ${forgeActionLabel(langMap, step.id)} (${step.delta > 0 ? '+' : ''}${step.delta}) = ${step.work}`,
        )
        .join('\n'),
    ),
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex w-24 flex-col gap-1 border-l-2 border-green-600 pl-2 text-xs text-green-700 dark:border-green-500 dark:text-green-400">
        {t('Current work', { note: 'recipe.forge.current' })}
        <Input
          inputMode="numeric"
          name="forge-start"
          autoComplete="off"
          value={startInput}
          disabled={solving}
          onChange={(event) => state.setStart(event.target.value)}
          placeholder="0"
        />
      </label>
      <label className="flex w-24 flex-col gap-1 border-l-2 border-red-600 pl-2 text-xs text-red-700 dark:border-red-500 dark:text-red-400">
        {t('Target', { note: 'recipe.forge.target' })}
        <Input
          inputMode="numeric"
          name="forge-target"
          autoComplete="off"
          value={targetInput}
          disabled={solving}
          onChange={(event) => state.setTarget(event.target.value)}
          placeholder="0"
        />
      </label>
      <Button
        onClick={state.solve}
        disabled={target === null || !rulesSupported || solving}
      >
        <Wand2 className="size-4" />
        {solving
          ? t('Solving…', { note: 'recipe.forge.solving' })
          : t('Solve', { note: 'recipe.forge.solve' })}
      </Button>
      <span className="flex items-center gap-1.5">
        <IconButton
          label={t('Undo last action', { note: 'recipe.forge.undo' })}
          disabled={!applied.length || solving}
          onClick={() => state.setApplied((prev) => prev.slice(0, -1))}
        >
          <Undo2 />
        </IconButton>
        <IconButton
          label={t('Reset the workpiece', { note: 'recipe.forge.reset' })}
          disabled={!applied.length || solving}
          onClick={() => state.setApplied([])}
        >
          <RotateCcw />
        </IconButton>
        <IconButton
          label={
            copied
              ? t('Copied', { note: 'recipe.forge.copied' })
              : t('Copy steps', { note: 'recipe.forge.copy' })
          }
          disabled={!steps.length}
          onClick={copy}
        >
          {copied ? (
            <Check className="text-green-600 dark:text-green-400" />
          ) : (
            <Copy />
          )}
        </IconButton>
      </span>
    </div>
  );
}

