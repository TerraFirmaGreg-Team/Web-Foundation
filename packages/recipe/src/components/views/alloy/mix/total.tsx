'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Input } from '@terrafirmagreg-team/ui/components/ui/input';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@terrafirmagreg-team/ui/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { INGOT_MB, suggestAmounts } from '@terrafirmagreg-team/recipe/lib/alloy/mix';
import { Percent } from 'lucide-react';
import type { AlloyComponent } from '@terrafirmagreg-team/recipe/types/alloy';
import type { MixState } from '@terrafirmagreg-team/recipe/hooks/alloy/use-mix-state';

export function MixTotal({
  state,
  components,
}: {
  state: MixState;
  components: readonly AlloyComponent[];
}) {
  const t = useTranslations();
  const {
    unit,
    total,
    totalNumber,
    totalInvalid,
    presets,
    ratioMix,
    format,
    unitLabel,
    applyTotal,
    switchUnit,
    fill,
  } = state;

  return (
    <>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex w-44 flex-col gap-1 text-xs text-muted-foreground">
          <span className="flex items-baseline justify-between gap-2">
            {t('Target total', { note: 'recipe.alloy.total' })}
            {unit === 'ingot' ? (
              <span className="tabular-nums text-muted-foreground/70">
                {Number.isFinite(totalNumber)
                  ? `= ${format(totalNumber * INGOT_MB)} ${t('mB', { note: 'recipe.alloy.unit.mb' })}`
                  : `×${INGOT_MB} ${t('mB', { note: 'recipe.alloy.unit.mb' })}`}
              </span>
            ) : null}
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Input
                  inputMode="decimal"
                  name="alloy-total"
                  autoComplete="off"
                  value={total}
                  onChange={(event) => applyTotal(event.target.value)}
                  placeholder={
                    unit === 'ingot' ? String(ratioMix?.total ?? 10) : '144'
                  }
                />
              }
            />
            <TooltipContent>{t('Scales the current mix to this total as you type', { note: 'recipe.alloy.hint.scale' })}</TooltipContent>
          </Tooltip>
          {totalInvalid ? (
            <span className="text-[11px] text-destructive">
              {t('Enter a positive total amount.', { note: 'recipe.alloy.invalid_total' })}
            </span>
          ) : null}
        </label>
        <ToggleGroup
          value={[unit]}
          onValueChange={(next) => {
            const value = next[0];
            if (value === 'mb' || value === 'ingot') switchUnit(value);
          }}
          variant="outline"
          size="sm"
          spacing={0}
          aria-label={t('units', { note: 'recipe.alloy.units' })}
        >
          <Tooltip>
            <TooltipTrigger render={<ToggleGroupItem value="mb" />}>
              {t('mB', { note: 'recipe.alloy.unit.mb' })}
            </TooltipTrigger>
            <TooltipContent>{t('Millibuckets (mB)', { note: 'recipe.alloy.hint.mb' })}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<ToggleGroupItem value="ingot" />}>
              {t('ing.', { note: 'recipe.alloy.unit.ingot' })}
            </TooltipTrigger>
            <TooltipContent>{t('Ingots: 1 ingot = 144 mB', { note: 'recipe.alloy.hint.ingot' })}</TooltipContent>
          </Tooltip>
        </ToggleGroup>
        <IconButton
          label={`${t('Fill by recipe', { note: 'recipe.alloy.fill' })}: ${t('Split the target total between metals by the recipe ratio', { note: 'recipe.alloy.hint.fill' })}`}
          disabled={!suggestAmounts(components, totalNumber)}
          onClick={() => fill(totalNumber)}
        >
          <Percent className="size-3.5" />
        </IconButton>
      </div>
      <div
        role="group"
        aria-label={t('Quick totals', { note: 'recipe.alloy.presets' })}
        className="flex flex-wrap gap-1.5"
      >
        {presets.map((value) => (
          <Button
            key={value}
            variant="outline"
            size="xs"
            className="tabular-nums"
            onClick={() => applyTotal(String(value))}
          >
            {format(value)} {unitLabel}
          </Button>
        ))}
      </div>
    </>
  );
}

