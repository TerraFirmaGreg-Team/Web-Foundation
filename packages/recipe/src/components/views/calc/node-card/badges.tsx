'use client';

import type { ReactNode } from 'react';
import { Mountain, Repeat } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import type { CalcFlowNode } from '@terrafirmagreg-team/recipe/lib/calc/flow';

const CORNER_CHIP =
  'flex shrink-0 items-center justify-center gap-0.5 rounded-sm border border-border bg-background px-0.5 py-px text-[9px] leading-none text-muted-foreground';

export function NodeBadges({
  node,
}: {
  node: CalcFlowNode['data']['node'];
}) {
  const t = useTranslations();
  const chips: ReactNode[] = [];
  if (node.cycle) {
    chips.push(
      <Hint key="cycle" label={t('Recipe cycle: the recipe needs itself upstream', { note: 'recipe.calc.hint.cycle' })} side="top">
        <span
          className={cn(CORNER_CHIP, 'border-red-500/40 text-red-500')}
        >
          <Repeat className="size-2.5" />
        </span>
      </Hint>,
    );
  }
  if (!node.recipe && !node.availableRecipes.length && !node.loading) {
    chips.push(
      <Hint key="source" label={t('No recipe: taken from remainders or gathered externally', { note: 'recipe.calc.hint.source' })} side="top">
        <span className={CORNER_CHIP}>
          <Mountain className="size-2.5" />
        </span>
      </Hint>,
    );
  }
  if (node.remaining < 0) {
    chips.push(
      <Hint key="over" label={t('Overdrawn: more is wired out than produced', { note: 'recipe.calc.overdrawn' })} side="top">
        <span
          className={cn(CORNER_CHIP, 'border-red-500/40 text-red-500')}
        >
          {formatCount(node.remaining)}
        </span>
      </Hint>,
    );
  }
  if (!chips.length) return null;
  return (
    <span className="pointer-events-auto absolute right-3 -bottom-1.5 z-30 flex flex-col-reverse items-end gap-0.5">
      {chips}
    </span>
  );
}

