'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import type { ReactNode } from 'react';
import {
  ChevronDown,
  ListFilter,
  Shapes,
} from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import type {
  CalcFlowData,
  CalcFlowNode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { RecipeCategory } from '@terrafirmagreg-team/recipe/types';

type CalcNode = CalcFlowNode['data']['node'];

export function CycleChip({
  onOpen,
  openLabel,
  title,
  accent,
  className,
  centerClassName,
  children,
}: {
  onOpen?: () => void;
  openLabel?: string;
  title?: string;
  accent?: boolean;
  className?: string;
  centerClassName?: string;
  children: ReactNode;
}) {
  const centerCls = cn(
    'flex min-w-0 flex-1 items-center justify-center gap-1 px-0.5 py-0.5 text-[10px] text-muted-foreground outline-none',
    onOpen && 'hover:text-foreground',
    accent && 'text-sky-500 hover:text-sky-400',
    centerClassName,
  );
  return (
    <span
      className={cn(
        'flex min-w-0 items-center overflow-hidden rounded-md border bg-background',
        accent ? 'border-sky-500/30' : 'border-border',
        className,
      )}
    >
      {onOpen ? (
        <Hint label={title} side="top">
          <button
            type="button"
            aria-label={openLabel}
            onClick={onOpen}
            className={centerCls}
          >
            {children}
          </button>
        </Hint>
      ) : (
        <Hint label={title} side="top">
          <span className={centerCls}>{children}</span>
        </Hint>
      )}
    </span>
  );
}

export function NodeChips({
  node,
  mini,
  name,
  category,
  hasAlternatives,
  dataset,
  lang,
  langMap,
  onRequestPicker,
  onRequestMemberPicker,
}: {
  node: CalcNode;
  mini: boolean;
  name: string;
  category: RecipeCategory | undefined;
  hasAlternatives: boolean;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  onRequestPicker: CalcFlowData['onRequestPicker'];
  onRequestMemberPicker: CalcFlowData['onRequestMemberPicker'];
}) {
  const t = useTranslations();
  const members = node.members;
  const loadingChip =
    node.loading && !node.recipe ? (
      <Skeleton className="h-5 min-w-0 flex-1 rounded-md" />
    ) : null;
  return (
    <div
      className={cn(
        'relative z-20 flex min-w-0 items-center gap-1 overflow-hidden',
        mini && 'h-5 w-full',
      )}
    >
      {loadingChip}
      {!node.recipe && !loadingChip ? (
        <CycleChip
          className="min-w-0 flex-1 border-dashed opacity-60"
          title={t('No recipe: taken from remainders or gathered externally', { note: 'recipe.calc.hint.source' })}
          centerClassName="py-0.5"
        >
          <ListFilter className="size-3 shrink-0" />
        </CycleChip>
      ) : null}
      {node.recipe ? (
        <CycleChip
          className="min-w-0 flex-1"
          title={node.recipe.recipeId}
          openLabel={t('Choose recipe', { note: 'recipe.calc.select' })}
          onOpen={() => onRequestPicker(node)}
        >
          {category?.icon ? (
            <Entry
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              reference={category.icon}
              name={node.recipe.category}
              size="sm"
              href={false}
              tooltip={false}
              missing="hide"
            />
          ) : (
            <Shapes
              className={mini ? 'size-3.5 shrink-0' : 'size-4'}
            />
          )}
          {hasAlternatives ? (
            <ChevronDown
              className={mini ? 'size-2.5 shrink-0' : 'size-3 shrink-0'}
            />
          ) : null}
        </CycleChip>
      ) : null}
      {node.tagId && members && members.length > 1 ? (
        <CycleChip
          accent
          className="shrink-0"
          title={
            mini
              ? `${node.tagId} ×${formatCount(members.length)}`
              : node.tagId
          }
          openLabel={t('Choose tag member', { note: 'recipe.calc.member.title' })}
          onOpen={() => onRequestMemberPicker(node)}
          centerClassName="px-0.5"
        >
          <Entry
            id={node.materialId}
            kind={node.kind}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            name={name}
            size="sm"
            href={false}
            tooltip={false}
          />
          {!mini ? (
            <span className="shrink-0 tabular-nums">
              ×{formatCount(members.length)}
            </span>
          ) : null}
          <ChevronDown className="size-2.5 shrink-0" />
        </CycleChip>
      ) : null}
    </div>
  );
}

