'use client';

import { useCallback, useMemo } from 'react';
import { encodeCalcState } from '@terrafirmagreg-team/recipe/lib/calc/tree';
import {
  summaryCacheFor,
  summarizeRecipes,
} from '@terrafirmagreg-team/recipe/lib/calc/resolve';
import { buildScheme, schemeSummary } from '@terrafirmagreg-team/recipe/lib/calc/scheme';
import { calcStorageKey } from '@terrafirmagreg-team/recipe/lib/calc/storage';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import type {
  CalcKind,
  CalcRecipeSummary,
} from '@terrafirmagreg-team/recipe/types/calc';
import { useCalcStorage } from './use-storage';
import { useCalcShare } from './use-share';
import { useCalcMaps } from './use-maps';
import { useCalcWorker } from './use-worker';
import { useCalcResolver } from './use-resolver';
import { useRecipeDefaults } from './use-defaults';

export function useCalcData(session: RecipeSession) {
  const { dataset } = session;
  const catalog = session.index;
  const storageKey = calcStorageKey('recipe', dataset);
  const sharePending = useCalcShare({
    storageKey,
    dataset,
    incoming: session.tree ?? '',
  });
  const {
    calcState,
    tabs,
    activeTabId,
    history,
    persist,
    openTab,
    openEntry,
    closeTab,
    newTab,
    renameTab,
    setTabIcon,
    removeHistory,
  } = useCalcStorage(storageKey);
  const { defaults, setRecipeDefault } = useRecipeDefaults(dataset);
  const { maps, data, applyMaps, resetMaps } = useCalcMaps();
  const { bodyMap } = maps;
  const {
    outMap: dataOutMap,
    recipeMap: dataRecipeMap,
    tagMap: dataTagMap,
    deadIds: dataDeadIds,
  } = data;

  const cards = useMemo(() => calcState?.cards ?? [], [calcState]);
  const wires = useMemo(() => calcState?.wires ?? [], [calcState]);
  const tagSelections = useMemo(
    () => calcState?.tagSelections ?? {},
    [calcState],
  );

  const getRecipesForItem = useCallback(
    (materialId: string, kind: CalcKind): CalcRecipeSummary[] => {
      if (!catalog) return [];
      return summarizeRecipes(
        dataOutMap,
        dataRecipeMap,
        catalog.types,
        summaryCacheFor(dataOutMap, dataRecipeMap),
        materialId,
        kind,
      );
    },
    [catalog, dataOutMap, dataRecipeMap],
  );

  const tagMembers = useCallback(
    (tagId: string) => dataTagMap.get(tagId),
    [dataTagMap],
  );

  const { nodes, flows } = useMemo(
    () =>
      buildScheme({
        cards,
        wires,
        ctx: {
          recipeMap: dataRecipeMap,
          getRecipesForItem,
          tagMembers,
          tagSelections,
          recipesResolved: (id) => dataOutMap.has(id),
          deadIds: dataDeadIds,
        },
      }),
    [
      cards,
      wires,
      dataRecipeMap,
      getRecipesForItem,
      tagMembers,
      tagSelections,
      dataOutMap,
      dataDeadIds,
    ],
  );

  const summary = useMemo(() => schemeSummary(nodes), [nodes]);

  const inputKey = useMemo(
    () => JSON.stringify([cards, wires, tagSelections]),
    [cards, wires, tagSelections],
  );

  const worker = useCalcWorker({
    dataset,
    catalog,
    activeTabId,
    applyMaps,
    resetMaps,
  });

  useCalcResolver({
    catalog,
    inputKey,
    cards,
    recipeMap: dataRecipeMap,
    worker,
  });

  const dataSettled = useMemo(() => {
    for (const card of cards) {
      if (!dataOutMap.has(card.materialId)) return false;
      if (
        card.recipeId &&
        !dataRecipeMap.has(card.recipeId) &&
        !dataDeadIds.has(card.recipeId)
      ) {
        return false;
      }
    }
    return true;
  }, [cards, dataOutMap, dataRecipeMap, dataDeadIds]);
  const settled = dataSettled && !sharePending;

  const encodeShare = useCallback(
    () =>
      encodeCalcState({
        cards,
        wires,
        tagSelections,
      }),
    [cards, wires, tagSelections],
  );

  const recipeBody = useCallback(
    (recipeId: string) => bodyMap.get(recipeId),
    [bodyMap],
  );

  const ensureMaterial = useCallback(
    (materialId: string) => {
      if (dataOutMap.has(materialId)) return;
      void worker
        .call((api) => api.resolve({ materials: [materialId] }))
        .catch(() => {});
    },
    [dataOutMap, worker],
  );

  return {
    cards,
    wires,
    tagSelections,
    tabs,
    activeTabId,
    history,
    openTab,
    openEntry,
    closeTab,
    newTab,
    renameTab,
    setTabIcon,
    removeHistory,
    recipeDefaults: defaults,
    setRecipeDefault,
    getRecipesForItem,
    ensureMaterial,
    tagMembers,
    nodes,
    flows,
    summary,
    persist,
    encodeShare,
    recipeBody,
    settled,
    bodiesLoaded: maps.bodyMap.size,
    workerSettled: worker.settled,
  };
}

