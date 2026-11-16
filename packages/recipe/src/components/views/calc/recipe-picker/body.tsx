'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useCardGrid } from '@terrafirmagreg-team/recipe/hooks/use-card-grid';
import { useCategoriesById } from '@terrafirmagreg-team/recipe/hooks/use-categories-by-id';
import { useFitPages } from '@terrafirmagreg-team/ui/hooks/page/use-fit-pages';
import {
  DialogHeader,
  DialogTitle,
} from '@terrafirmagreg-team/ui/components/ui/dialog';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { RecipeFrame } from '@terrafirmagreg-team/recipe/components/views/browser/frame';
import { RecipeCardGrid } from '@terrafirmagreg-team/recipe/components/views/browser/card-grid';
import { recipeCardFitDim } from '@terrafirmagreg-team/recipe/lib/browser/card-dim';
import { RecipeTypeTabs } from '@terrafirmagreg-team/recipe/components/views/browser/type-tabs';
import {
  rowMatchesTerms,
  rowSearchTerms,
} from '@terrafirmagreg-team/recipe/lib/browser/row-search';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { PlaceHeader } from '@terrafirmagreg-team/recipe/components/views/browser/place-header';
import { WorkstationRail } from '@terrafirmagreg-team/recipe/components/views/browser/workstation-rail';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import { PickerFooter } from './footer';

export function PickerBody({
  node,
  session,
  onSelectRecipe,
  onSelectTagMember,
  recipeDefaults,
  actions,
  close,
}: {
  node: CalcFlowData['node'];
  session: RecipeSession;
  onSelectRecipe: CalcFlowData['onSelectRecipe'];
  onSelectTagMember: CalcFlowData['onSelectTagMember'];
  recipeDefaults: CalcFlowData['recipeDefaults'];
  onSetRecipeDefault: CalcFlowData['onSetRecipeDefault'];
  actions?: ReactNode;
  close: () => void;
}) {
  const t = useTranslations();
  const { dataset, lang, langMap, index } = session;
  const recipes = node.availableRecipes;
  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const row of recipes) seen.add(row.category);
    return [...seen];
  }, [recipes]);
  const [tab, setTab] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pinned, setPinned] = useState(true);
  const [query, setQuery] = useState('');
  const recipeKey = `${node.materialId}${node.recipe?.recipeId ?? ''}`;
  const [seenRecipeKey, setSeenRecipeKey] = useState(recipeKey);
  if (seenRecipeKey !== recipeKey) {
    setSeenRecipeKey(recipeKey);
    setTab(null);
    setPinned(true);
    setPage(0);
    setQuery('');
  }
  const defaultRecipeId = recipeDefaults[node.materialId];
  const active =
    tab != null && categories.includes(tab)
      ? tab
      : (recipes.find((row) => row.recipeId === node.recipe?.recipeId)
          ?.category ??
        recipes.find((row) => row.recipeId === defaultRecipeId)?.category ??
        categories[0]);
  const categoriesById = useCategoriesById(index);
  const terms = useMemo(() => rowSearchTerms(query), [query]);
  const rows = useMemo(
    () =>
      recipes
        .filter(
          (row) =>
            row.category === active &&
            (!terms.length ||
              rowMatchesTerms(row.row, terms, (id) =>
                recipeItemName(session.names, lang, id),
              )),
        )
        .sort((a, b) =>
          (b.recipeId === defaultRecipeId ? 1 : 0) -
          (a.recipeId === defaultRecipeId ? 1 : 0),
        )
        .map((row) => row.row),
    [recipes, active, terms, defaultRecipeId, session.names, lang],
  );
  const boxRef = useRef<HTMLDivElement | null>(null);
  const focusIndex = rows.findIndex(
    (row) => row.id === node.recipe?.recipeId,
  );
  const { grid } = useCardGrid();
  const list = useFitPages(
    boxRef,
    rows,
    (row, box) =>
      recipeCardFitDim(index ?? null, categoriesById, row, box),
    page,
    8,
    pinned && focusIndex >= 0 ? focusIndex : undefined,
    !grid,
  );
  const goPage = (next: number) => {
    setPinned(false);
    setPage(next);
  };
  const custom =
    !!node.recipe &&
    node.recipe.recipeId !== (defaultRecipeId ?? recipes[0]?.recipeId);
  const members =
    node.tagId && node.members && node.members.length > 1
      ? node.members
      : undefined;
  const frameSession = {
    ...session,
    place: active ? { kind: 'type' as const, id: active } : session.place,
    rquery: query,
    setRquery: setQuery,
  };
  const gridSession = { ...frameSession, recipeId: node.recipe?.recipeId };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex min-w-0 items-center gap-2 pe-8">
          <Entry
            id={node.materialId}
            kind={node.kind}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            size="sm"
            labeled
            href={false}
            tooltip="adaptive"
          />
          {custom ? (
            <Button
              size="xs"
              variant="outline"
              className="ms-auto shrink-0"
              onClick={() => {
                onSelectRecipe(
                  node.id,
                  defaultRecipeId ?? recipes[0]?.recipeId ?? null,
                );
                close();
              }}
            >
              <Sparkles className="size-3.5" />
              {t('Default recipe', { note: 'recipe.calc.auto.title' })}
            </Button>
          ) : null}
          {actions}
        </DialogTitle>
      </DialogHeader>
      <RecipeFrame
        session={frameSession}
        list={list}
        strip={
          <RecipeTypeTabs
            session={session}
            ids={categories}
            value={active}
            onChange={(id) => {
              setTab(id);
              goPage(0);
            }}
          />
        }
        header={
          <div className="mx-auto w-full max-w-90">
            <PlaceHeader
              session={frameSession}
              overline={t('Categories', { note: 'recipe.axis_type' })}
            />
          </div>
        }
        rail={
          <WorkstationRail
            session={session}
            workstations={
              active ? categoriesById.get(active)?.workstations : undefined
            }
          />
        }
        onPageChange={goPage}
        search
        searchPersist={false}
      >
        <RecipeCardGrid
          session={gridSession}
          rows={list.shown}
          boxRef={boxRef}
          maxH={list.box.h}
          maxW={list.box.w}
          vertical={!grid}
          loading={!list.measured}
          empty={t('No recipes of this type.', { note: 'recipe.empty_type' })}
          onSwipe={(dir) =>
            goPage((list.page + dir + list.pages) % Math.max(list.pages, 1))
          }
          onPick={(recipeId) => {
            onSelectRecipe(node.id, recipeId);
            close();
          }}
          defaultMaterial={node.materialId}
        />
      </RecipeFrame>
      <PickerFooter
        node={node}
        members={members}
        dataset={dataset}
        lang={lang}
        langMap={langMap}
        onSelectTagMember={onSelectTagMember}
      />
    </>
  );
}

