'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Check, X } from 'lucide-react';
import { GUI_PANEL } from '@terrafirmagreg-team/recipe/components/views/forge/gui';
import type { ForgeState } from '@terrafirmagreg-team/recipe/hooks/forge/use-forge-state';

export function StatusPlate({
  state,
  scale,
}: {
  state: ForgeState;
  scale: number;
}) {
  const t = useTranslations();
  const PX = (v: number) => v * scale;
  const { work, target, finished, failed } = state;

  return (
    <div
      className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground tabular-nums"
      style={{ width: PX(GUI_PANEL.w) }}
    >
      <span>
        {t('Work', { note: 'recipe.forge.work' })}:{' '}
        <span className="font-medium text-green-700 dark:text-green-400">
          {work}
        </span>
      </span>
      <span>
        {t('Target', { note: 'recipe.forge.target' })}:{' '}
        <span className="font-medium text-red-700 dark:text-red-400">
          {target ?? 0}
        </span>
      </span>
      {finished ? (
        <span className="inline-flex items-center gap-1 text-green-600 animate-in fade-in-0">
          <Check className="size-3" /> {t('Done', { note: 'recipe.forge.done' })}
        </span>
      ) : null}
      {failed ? (
        <span
          role="status"
          className="inline-flex items-center gap-1 text-destructive"
        >
          <X className="size-3" /> {t('No sequence reaches this target under these rules. Reset the workpiece and try another target.', { note: 'recipe.forge.no_solution' })}
        </span>
      ) : null}
      {target !== null && work > target && !failed ? (
        <span>{t('Work is above the target, use Draw or lighter hits to come back.', { note: 'recipe.forge.over_target' })}</span>
      ) : null}
    </div>
  );
}

