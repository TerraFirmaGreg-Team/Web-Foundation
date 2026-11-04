'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  ExternalLink,
  ListFilter,
  Pin,
  PinOff,
  Plus,
  Shapes,
  Target,
  Undo2,
} from 'lucide-react';
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from '@terrafirmagreg-team/ui/components/ui/context-menu';
import { HoverCardContent } from '@terrafirmagreg-team/ui/components/ui/hover-card';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { PagedCard } from '@terrafirmagreg-team/recipe/components/cards/paged-card';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { CalcKind } from '@terrafirmagreg-team/recipe/types/calc';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeCategory } from '@terrafirmagreg-team/recipe/types';

export function NodeContextMenu({
  data,
  lang,
  langMap,
}: {
  data: CalcFlowData;
  lang: string;
  langMap?: Record<string, string>;
}) {
  const {
    node,
    dataset,
    onAddCard,
    onOpenItem,
    onSelectRecipe,
    onRequestPicker,
    onRequestMemberPicker,
    recipeDefaults,
    onSetRecipeDefault,
  } = data;
  const members = node.members;
  const t = useTranslations();
  return (
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuLabel className="flex items-center gap-1.5">
          <Entry
            id={node.materialId}
            kind={node.kind}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            size="sm"
            labeled
            href={false}
            tooltip={false}
          />
        </ContextMenuLabel>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuItem
        className="whitespace-nowrap"
        onClick={() => onAddCard(node.materialId, node.kind)}
      >
        <Target />
        {t('Add card', { note: 'recipe.calc.add.goal' })}
      </ContextMenuItem>
      <ContextMenuItem
        className="whitespace-nowrap"
        onClick={() => onOpenItem(node.materialId, node.kind)}
      >
        <ExternalLink />
        {t('Open item page', { note: 'recipe.calc.open.item' })}
      </ContextMenuItem>
      {node.recipe ? (
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() =>
            onSetRecipeDefault(
              node.materialId,
              recipeDefaults[node.materialId] === node.recipe!.recipeId
                ? null
                : node.recipe!.recipeId,
            )
          }
        >
          {recipeDefaults[node.materialId] === node.recipe.recipeId ? (
            <>
              <PinOff />
              {t('Unpin default recipe', { note: 'recipe.calc.clear.default' })}
            </>
          ) : (
            <>
              <Pin />
              {t('Pin as default recipe', { note: 'recipe.calc.set_default' })}
            </>
          )}
        </ContextMenuItem>
      ) : null}
      {node.recipe ? (
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() => onSelectRecipe(node.id, null)}
        >
          <Undo2 />
          {t('Remove recipe', { note: 'recipe.calc.remove.recipe' })}
        </ContextMenuItem>
      ) : null}
      {!node.recipe && node.availableRecipes.length > 0 ? (
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() => onRequestPicker(node)}
        >
          <Plus />
          {t('Pick a recipe', { note: 'recipe.calc.pick.title' })}
        </ContextMenuItem>
      ) : null}
      {node.tagId && members && members.length > 1 ? (
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() => onRequestMemberPicker(node)}
        >
          <ListFilter />
          {t('Choose tag member', { note: 'recipe.calc.member.title' })}
        </ContextMenuItem>
      ) : null}
    </ContextMenuContent>
  );
}

export function PortContextMenu({
  data,
  node,
  input,
  out,
  id,
  kind,
  dataset,
  lang,
  langMap,
}: {
  data: CalcFlowData;
  node: CalcFlowData['node'];
  input?: number;
  out?: number;
  id: string;
  kind: CalcKind;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
}) {
  const { onAddCard, onOpenItem, onRequestPicker, onRequestSupply } = data;
  const t = useTranslations();
  return (
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuLabel className="flex items-center gap-1.5">
          <Entry
            id={id}
            kind={kind}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            size="sm"
            labeled
            href={false}
            tooltip={false}
          />
        </ContextMenuLabel>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      {input != null ? (
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() => onRequestSupply(node, input)}
        >
          <Plus />
          {t('Keep as external source', { note: 'recipe.calc.supply.source' })}
        </ContextMenuItem>
      ) : null}
      {out === 0 && !node.recipe && node.availableRecipes.length > 0 ? (
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() => onRequestPicker(node)}
        >
          <ListFilter />
          {t('Pick a recipe', { note: 'recipe.calc.pick.title' })}
        </ContextMenuItem>
      ) : null}
      <ContextMenuItem
        className="whitespace-nowrap"
        onClick={() => onAddCard(id, kind)}
      >
        <Target />
        {t('Add card', { note: 'recipe.calc.add.goal' })}
      </ContextMenuItem>
      <ContextMenuItem
        className="whitespace-nowrap"
        onClick={() => onOpenItem(id, kind)}
      >
        <ExternalLink />
        {t('Open item page', { note: 'recipe.calc.open.item' })}
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

export function NodeHoverContent({
  data,
  lang,
  langMap,
  category,
  body,
  src,
  name,
  onFail,
}: {
  data: CalcFlowData;
  lang: string;
  langMap?: Record<string, string>;
  category: RecipeCategory | undefined;
  body: Recipe | undefined;
  src: string | undefined;
  name: string;
  onFail: () => void;
}) {
  const { node, dataset } = data;
  return (
    <HoverCardContent
      side="right"
      align="start"
      className="w-fit max-w-[min(80vw,560px)] overflow-hidden p-0"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5 text-xs text-muted-foreground">
        {category?.icon ? (
          <Entry
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            reference={category.icon}
            name={node.recipe!.category}
            size="sm"
            href={false}
            tooltip={false}
            missing="hide"
          />
        ) : (
          <Shapes className="size-3.5 shrink-0" />
        )}
        <span className="truncate">
          {body ? recipeTitle(body, langMap ?? {}) : name}
        </span>
      </div>
      {body && src ? (
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
          onFail={onFail}
        />
      ) : null}
    </HoverCardContent>
  );
}

