'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { INGOT_MB } from '@terrafirmagreg-team/recipe/lib/alloy/mix';
import type { AlloyComponent } from '@terrafirmagreg-team/recipe/types/alloy';
import type { MixState } from '@terrafirmagreg-team/recipe/hooks/alloy/use-mix-state';

export function RatioPanel({
  state,
  components,
}: {
  state: MixState;
  components: readonly AlloyComponent[];
}) {
  const t = useTranslations();
  const { ratioMix, colors, name, applyRatioMix } = state;

  if (!ratioMix) return null;
  return (
    <div className="space-y-1.5 rounded-md border border-dashed px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {t('Recipe ratio in ingots', { note: 'recipe.alloy.ratio_ingots' })}
        </span>
        <span className="ms-auto flex shrink-0 items-center gap-1.5">
          {[2, 4, 8].map((mult) => {
            const text = components
              .map(({ slot }, i) => `${ratioMix.counts[i] * mult}×${name(slot.id)}`)
              .join(' + ');
            return (
              <Tooltip key={mult}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="xs"
                      aria-label={`${t('Apply the recipe ratio multiplied', { note: 'recipe.alloy.hint.mult' })}: ${text}`}
                      onClick={() => applyRatioMix(mult)}
                    />
                  }
                >
                  ×{mult}
                </TooltipTrigger>
                <TooltipContent>{text}</TooltipContent>
              </Tooltip>
            );
          })}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyRatioMix()}
                />
              }
            >
              {t('Apply', { note: 'recipe.alloy.apply' })}
            </TooltipTrigger>
            <TooltipContent>{t('Fill fields with the recipe ratio in whole ingots', { note: 'recipe.alloy.hint.apply' })}</TooltipContent>
          </Tooltip>
        </span>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {components.map(({ slot }, i) => (
          <span
            key={slot.id}
            className="inline-flex min-w-0 items-center gap-1 tabular-nums"
          >
            {i > 0 ? <span className="text-muted-foreground">+</span> : null}
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: colors[i] }}
            />
            <span className="max-w-40 truncate" title={name(slot.id)}>
              {ratioMix.counts[i]}×{name(slot.id)}
            </span>
          </span>
        ))}
        <span className="tabular-nums text-muted-foreground">
          → {ratioMix.total.toLocaleString()} {t('ing.', { note: 'recipe.alloy.unit.ingot' })} (
          {(ratioMix.total * INGOT_MB).toLocaleString()} {t('mB', { note: 'recipe.alloy.unit.mb' })})
        </span>
      </div>
    </div>
  );
}

