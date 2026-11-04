'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Input } from '@terrafirmagreg-team/ui/components/ui/input';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { minShareMix } from '@terrafirmagreg-team/recipe/lib/alloy/mix';
import { AlloyRangeBar } from '@terrafirmagreg-team/recipe/components/views/alloy/range-bar';
import { Check, Minus, Plus, TrendingDown, X } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { AlloyComponent } from '@terrafirmagreg-team/recipe/types/alloy';
import type { MixState } from '@terrafirmagreg-team/recipe/hooks/alloy/use-mix-state';

export function MixRows({
  state,
  components,
}: {
  state: MixState;
  components: readonly AlloyComponent[];
}) {
  const t = useTranslations();
  const {
    mix,
    fix,
    econTotal,
    colors,
    inputs,
    unitLabel,
    name,
    format,
    formatPercent,
    trim,
    setInputs,
    stepInput,
  } = state;

  return (
    <ul className="space-y-3">
      {components.map(({ slot, range }, i) => {
        const row = mix.rows[i];
        const missing = fix?.[i];
        const econ = range ? minShareMix(components, i, econTotal) : null;
        return (
          <li
            key={slot.id}
            className={cn(
              'grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-md px-2 py-1.5 transition-colors lg:grid-cols-[minmax(0,12rem)_1fr_auto_minmax(3.5rem,auto)]',
              row?.valid === false && 'bg-destructive/5',
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[i] }}
              />
              <Entry reference={slot.ref} labeled className="min-w-0" />
              {row?.valid === false ? (
                <X className="size-3.5 shrink-0 text-destructive" />
              ) : row?.valid ? (
                <Check className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <span className="size-3.5 shrink-0" aria-hidden />
              )}
            </span>
            <span className="flex w-16 flex-col items-end justify-self-end text-right text-sm tabular-nums text-muted-foreground lg:order-last lg:w-20">
              <span>{formatPercent(row?.percent ?? 0)}%</span>
              {missing !== undefined && missing > 0 ? (
                <span className="text-[11px] leading-tight text-destructive">
                  +{format(missing)}
                </span>
              ) : null}
            </span>
            <span className="col-span-2 lg:col-span-1">
              {range ? (
                <AlloyRangeBar
                  min={range.min}
                  max={range.max}
                  value={row?.percent ?? 0}
                  color={colors[i]}
                  label={`${t('Allowed window', { note: 'recipe.alloy.range_allowed' })}: ${formatPercent(
                    range.min,
                  )}–${formatPercent(range.max)}%`}
                />
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </span>
            <span className="col-span-2 flex items-center justify-end gap-1 lg:col-span-1">
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={`${t('Remove 1', { note: 'recipe.alloy.step.down' })} ${name(slot.id)}`}
                onClick={() => stepInput(i, -1)}
              >
                <Minus />
              </Button>
              <Input
                inputMode="decimal"
                name={`alloy-${slot.id}`}
                autoComplete="off"
                className="w-16 justify-self-end"
                value={inputs[i] ?? ''}
                onChange={(event) =>
                  setInputs((prev) =>
                    prev.map((value, j) =>
                      j === i ? event.target.value : value,
                    ),
                  )
                }
                aria-label={name(slot.id)}
              />
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={`${t('Add 1', { note: 'recipe.alloy.step.up' })} ${name(slot.id)}`}
                onClick={() => stepInput(i, 1)}
              >
                <Plus />
              </Button>
              <span className="w-8 text-xs text-muted-foreground">
                {unitLabel}
              </span>
              {range ? (
                <IconButton
                  label={`${t('Minimize', { note: 'recipe.alloy.economize' })} ${name(slot.id)}: ${t('Set this metal to the lower bound of its range; others keep the recipe ratio', { note: 'recipe.alloy.hint.economize' })}`}
                  size="icon-xs"
                  disabled={!econ}
                  onClick={() =>
                    econ && setInputs(econ.map((value) => trim(value)))
                  }
                >
                  <TrendingDown />
                </IconButton>
              ) : (
                <span className="size-6 shrink-0" aria-hidden />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

