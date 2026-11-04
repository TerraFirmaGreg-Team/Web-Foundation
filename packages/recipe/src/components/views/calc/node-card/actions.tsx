'use client';

import { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Layers,
  X,
} from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { CalcFlowNode } from '@terrafirmagreg-team/recipe/lib/calc/flow';

export const CORNER_BUTTON =
  'nodrag flex size-5 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground';

export function NodeActions({
  data,
  nodeId,
}: {
  data: CalcFlowNode['data'];
  nodeId: string;
}) {
  const { node, onRemoveCard, onOpenItem, onRequestPicker } = data;
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const canPick = node.recipe != null || node.availableRecipes.length > 0;

  return (
    <span className="pointer-events-auto absolute -top-2 right-3 z-30 flex gap-0.5">
      {canPick ? (
        <Hint label={t('Pick a recipe', { note: 'recipe.calc.pick.title' })} side="top">
          <button
            type="button"
            aria-label={t('Pick a recipe', { note: 'recipe.calc.pick.title' })}
            onClick={() => onRequestPicker(node)}
            className={CORNER_BUTTON}
          >
            <Layers className="size-2.5" />
          </button>
        </Hint>
      ) : null}
      <Hint label={t('Copy id', { note: 'recipe.calc.copy_id' })} side="top">
        <button
          type="button"
          aria-label={t('Copy id', { note: 'recipe.calc.copy_id' })}
          onClick={() => {
            void navigator.clipboard.writeText(node.materialId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className={CORNER_BUTTON}
        >
          {copied ? (
            <Check className="size-2.5 text-emerald-500" />
          ) : (
            <Copy className="size-2.5" />
          )}
        </button>
      </Hint>
      <Hint label={t('Open item page', { note: 'recipe.calc.open.item' })} side="top">
        <button
          type="button"
          aria-label={t('Open item page', { note: 'recipe.calc.open.item' })}
          onClick={() => onOpenItem(node.materialId, node.kind)}
          className={CORNER_BUTTON}
        >
          <ExternalLink className="size-2.5" />
        </button>
      </Hint>
      <Hint label={t('Remove card', { note: 'recipe.calc.remove.title' })} side="top">
        <button
          type="button"
          aria-label={t('Remove card', { note: 'recipe.calc.remove.title' })}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onRemoveCard(nodeId);
          }}
          className={cn(CORNER_BUTTON, 'hover:text-destructive')}
        >
          <X className="size-3" />
        </button>
      </Hint>
    </span>
  );
}

