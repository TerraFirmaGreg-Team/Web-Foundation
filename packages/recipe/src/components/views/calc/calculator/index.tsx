'use client';

import { useDeferredValue, useMemo } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { LeftSidebarPortal } from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { CalcFlow } from '@terrafirmagreg-team/recipe/components/views/calc/flow';
import { CalcSidebar } from '@terrafirmagreg-team/recipe/components/views/calc/sidebar';
import { CalcHistoryList } from '@terrafirmagreg-team/recipe/components/views/calc/trees';
import { CalcActions } from '@terrafirmagreg-team/recipe/components/views/calc/calculator/actions';
import { useCalcFocus } from '@terrafirmagreg-team/recipe/hooks/calc/use-focus';
import { useCalcReset } from '@terrafirmagreg-team/recipe/hooks/calc/use-reset';
import { useCalcAmounts } from '@terrafirmagreg-team/recipe/hooks/calc/use-amounts';
import { useCalcActions } from '@terrafirmagreg-team/recipe/hooks/calc/use-actions';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import { useCalcData } from '@terrafirmagreg-team/recipe/hooks/calc/use-data';
import { useCalcViewMode } from '@terrafirmagreg-team/recipe/hooks/calc/use-view-mode';
import { useCalcFarMode } from '@terrafirmagreg-team/recipe/hooks/calc/use-far-mode';
import { useCalcRecipeIdsMode } from '@terrafirmagreg-team/recipe/hooks/calc/use-recipe-ids';
import { useCalcSnap } from '@terrafirmagreg-team/recipe/hooks/calc/use-snap';
import { useCalcHistory } from '@terrafirmagreg-team/recipe/hooks/calc/use-history';

export function Calculator({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const { dataset, lang } = session;
  const [mode, setMode] = useCalcViewMode();
  const [farCards, setFarCards] = useCalcFarMode();
  const [recipeIds, setRecipeIds] = useCalcRecipeIdsMode();
  const [snap, setSnap] = useCalcSnap();
  const {
    cards,
    pipes,
    tagSelections,
    notes,
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
    recipeDefaults,
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
    shareFailed,
  } = useCalcData(session);
  const {
    write: persistTracked,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useCalcHistory(
    { cards, pipes, tagSelections, notes },
    persist,
    activeTabId ?? undefined,
  );
  const deferredNodes = useDeferredValue(nodes);
  const deferredFlows = useDeferredValue(flows);
  const deferredLangMap = useDeferredValue(session.langMap);
  const { focusNodeRef, onFocusNode, focusNodeId, setFocusNodeId } =
    useCalcFocus(cards);
  const { resetGen } = useCalcReset(activeTabId);
  const { displayCards, pendingCrafts, flushAmounts, onCrafts } =
    useCalcAmounts({
      cards,
      pipes,
      tagSelections,
      notes,
      resolved: deferredNodes,
      persist: persistTracked,
    });
  const {
    shared,
    sharing,
    shareError,
    onShare,
    flowData,
    onMoveCards,
    onAddNote,
    onClear,
  } = useCalcActions({
    dataset,
    lang,
    linkVersion: session.nav.version,
    cards: displayCards,
    pipes,
    tagSelections,
    notes,
    persist: persistTracked,
    recipeDefaults,
    setRecipeDefault,
    recipeBody,
    encodeShare,
    flushAmounts,
    setFocusNodeId,
    nodes: deferredNodes,
    tagMembers,
    ensureMaterial,
  });

  const iconItems = useMemo(
    () => [
      ...(session.index?.items ?? []).map(
        (id) => ({ id, kind: 'item' as const }),
      ),
      ...(session.index?.fluids ?? []).map(
        (id) => ({ id, kind: 'fluid' as const }),
      ),
    ],
    [session.index],
  );

  const data = useMemo(
    () => ({
      ...flowData,
      onCrafts,
      pendingCrafts,
      getRecipesForItem,
      ensureMaterial,
    }),
    [flowData, onCrafts, pendingCrafts, getRecipesForItem, ensureMaterial],
  );

  return (
    <>
      <LeftSidebarPortal>
        <CalcSidebar
          dataset={dataset}
          lang={lang}
          version={session.nav.version}
          langMap={deferredLangMap}
          summary={summary}
          onFocus={onFocusNode}
          trees={{
            tabs,
            activeId: activeTabId,
            history,
            iconItems,
            onOpen: openTab,
            onOpenEntry: openEntry,
            onClose: closeTab,
            onRename: renameTab,
            onSetIcon: setTabIcon,
            onNew: newTab,
            onRemoveHistory: removeHistory,
          }}
        />
      </LeftSidebarPortal>
      <CalcFlow
        nodes={deferredNodes}
        pipes={pipes}
        flows={deferredFlows}
        cards={displayCards}
        dataset={dataset}
        session={session}
        data={data}
        mode={mode}
        onModeChange={setMode}
        farCards={farCards}
        onFarCardsChange={setFarCards}
        recipeIds={recipeIds}
        onRecipeIdsChange={setRecipeIds}
        snap={snap}
        onSnapChange={setSnap}
        notes={notes}
        onAddNote={onAddNote}
        history={{ canUndo, canRedo, onUndo: undo, onRedo: redo }}
        treeReady={settled}
        resetGen={resetGen}
        canvasId={activeTabId ?? undefined}
        onRelayout={onMoveCards}
        actions={
          <CalcActions
            session={session}
            shared={shared}
            sharing={sharing}
            shareError={shareError}
            shareFailed={shareFailed}
            onShare={onShare}
            hasTargets={displayCards.length > 0}
            onClear={onClear}
          />
        }
        focusRef={focusNodeRef}
        focusNodeId={focusNodeId}
        onFocusedNode={() => setFocusNodeId(null)}
        empty={
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-auto p-4">
            <div className="pointer-events-auto flex flex-col items-center gap-4">
              <EmptyState variant="empty">
                {t('Click an item in the catalog to add a card.', { note: 'recipe.calc.empty' })}
              </EmptyState>
              <CalcHistoryList
                history={history}
                onOpen={openEntry}
                meta={{ dataset, lang, langMap: session.langMap }}
              />
            </div>
          </div>
        }
      />
    </>
  );
}

