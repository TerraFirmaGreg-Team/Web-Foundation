'use client';

import {
  type NodeProps,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { ListFilter } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { StackCount } from '@terrafirmagreg-team/game/components/entry/stack-count';
import { PagedCard } from '@terrafirmagreg-team/recipe/components/cards/paged-card';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { useCalcSession } from '@terrafirmagreg-team/recipe/hooks/calc/use-calc-session';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import {
  recipeCardImageUrl,
  recipeImageUrl,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { CalcFlowNode } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { CORNER_BUTTON } from './actions';
import { CardHandles } from './ports';

export function CalcHiddenCard({ data }: NodeProps<CalcFlowNode>) {
  return (
    <div data-calc-card className="relative h-full w-full">
      <CardHandles node={data.node} interactive={false} />
      <Skeleton className="size-full rounded-md" />
    </div>
  );
}

export function CalcFarCard({ data, selected }: NodeProps<CalcFlowNode>) {
  const { node, dataset, mode, recipeBody, onRequestPicker } = data;
  const t = useTranslations();
  const session = useCalcSession();
  const lang = session?.lang ?? 'en_us';
  const names = session?.names ?? {};
  const langMap = session?.langMap;
  const name = recipeItemName(names, lang, node.materialId);
  const body = node.recipe ? recipeBody(node.recipe.recipeId) : undefined;
  const src = body
    ? (recipeImageUrl(dataset, body) ??
      recipeCardImageUrl(dataset, body.id))
    : undefined;
  const pickable =
    node.recipe != null || node.availableRecipes.length > 0;
  const stateCls = cn(
    node.cycle && 'border-red-500/70',
    !node.cycle && node.recipe && 'border-primary/60',
    !node.recipe && 'border-dashed border-muted-foreground/50',
    selected && 'ring-2 ring-primary/70',
  );
  return (
    <div
      data-calc-card
      className={cn(
        'relative flex h-full w-full flex-col justify-center gap-0.5 rounded-md border bg-card px-2 py-1 text-xs',
        stateCls,
      )}
    >
      <CardHandles node={node} interactive={false} />
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="size-4 shrink-0 rounded-sm border border-border bg-muted/40" />
        <span className="min-w-0 flex-1 truncate">
          <StackCount count={node.produced} /> {name}
        </span>
      </div>
      {mode === 'detailed' && body && src ? (
        <div className="nodrag pointer-events-none mx-auto mt-1 select-none">
          <PagedCard
            recipe={body}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            title={recipeTitle(body, langMap ?? {})}
            src={src}
            naturalW={body.w}
            naturalH={body.h}
            interactive={false}
            slotTooltip="none"
            frameOnly
            onFail={() => {}}
          />
        </div>
      ) : null}
      {pickable ? (
        <button
          type="button"
          aria-label={t('Choose recipe', { note: 'recipe.calc.select' })}
          onClick={(event) => {
            event.stopPropagation();
            onRequestPicker(node);
          }}
          className={cn(CORNER_BUTTON, 'absolute -top-2 right-1')}
        >
          <ListFilter className="size-2.5" />
        </button>
      ) : null}
    </div>
  );
}

export function CalcDotCard({ data, selected }: NodeProps<CalcFlowNode>) {
  const { node } = data;
  const stateCls = cn(
    node.cycle && 'border-red-500/70',
    !node.cycle && node.recipe && 'border-primary/60',
    !node.recipe && 'border-dashed border-muted-foreground/50',
    selected && 'ring-2 ring-primary/70',
  );
  return (
    <div
      data-calc-card
      className={cn(
        'h-full w-full overflow-hidden rounded-md border bg-card',
        stateCls,
      )}
    >
      <CardHandles node={node} interactive={false} />
    </div>
  );
}

