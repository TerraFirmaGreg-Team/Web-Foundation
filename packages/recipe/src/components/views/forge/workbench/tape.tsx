'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { GuiSprite, actionGlyphRect } from '@terrafirmagreg-team/recipe/components/views/forge/gui';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ForgeState } from '@terrafirmagreg-team/recipe/hooks/forge/use-forge-state';

const TAPE_MAX = 12;

export function StepTape({
  atlas,
  state,
}: {
  atlas: string | undefined;
  state: ForgeState;
}) {
  const t = useTranslations();
  const { steps, expanded, setExpanded, setApplied } = state;
  const tapeHidden = Math.max(0, steps.length - TAPE_MAX);
  const tapeShown = expanded ? steps : steps.slice(tapeHidden);

  if (!steps.length) return null;
  return (
    <ol className="flex flex-wrap gap-1.5">
      {tapeHidden > 0 && !expanded ? (
        <li>
          <button
            type="button"
            title={t('Show all steps', { note: 'recipe.forge.expand_steps' })}
            aria-label={t('Show all steps', { note: 'recipe.forge.expand_steps' })}
            onClick={() => setExpanded(true)}
            className="flex items-center rounded border border-dashed px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground hover:bg-accent"
          >
            …+{tapeHidden}
          </button>
        </li>
      ) : null}
      {tapeShown.map((step, j) => {
        const i = expanded ? j : tapeHidden + j;
        return (
          <li key={i} className="animate-in fade-in-0 zoom-in-95 duration-150">
            <button
              type="button"
              title={t('Trim to this step', { note: 'recipe.forge.trim_to' })}
              onClick={() => setApplied((prev) => prev.slice(0, i + 1))}
              className={cn(
                'flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-xs tabular-nums hover:bg-accent',
                step.delta < 0 ? 'border-red-500/30' : 'border-green-500/30',
              )}
            >
              <span className="text-muted-foreground">{i + 1}</span>
              <GuiSprite
                gui={atlas}
                rect={actionGlyphRect(step.id)}
                scale={14 / 32}
                className="size-3.5"
              />
              <span>
                {step.delta > 0 ? '+' : ''}
                {step.delta}
              </span>
              <span className="text-muted-foreground">→ {step.work}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

