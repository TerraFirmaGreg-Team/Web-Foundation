'use client';

import type { ReactNode } from 'react';
import { Redo2, RotateCcw, StickyNote, Undo2 } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  ViewerControls,
  ViewerToolbar,
} from '@terrafirmagreg-team/ui/components/blocks/viewer/controls';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { CalcViewMenu } from './view-menu';
import type {
  CalcFarMode,
  CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';

export function CalcToolbar({
  onFit,
  onRelayout,
  onZoomIn,
  onZoomOut,
  onAddNote,
  actions,
  history,
  ...view
}: {
  onFit: () => void;
  onRelayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddNote?: () => void;
  actions?: ReactNode;
  history?: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  };
  mode: CalcViewMode;
  onModeChange: (mode: CalcViewMode) => void;
  farCards: CalcFarMode;
  onFarCardsChange: (mode: CalcFarMode) => void;
  recipeIds: boolean;
  onRecipeIdsChange: (show: boolean) => void;
  snap: boolean;
  onSnapChange: (snap: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <ViewerToolbar>
      <ViewerControls
        start={[
          <CalcViewMenu key="view" {...view} />,
          ...(history
            ? [
                <IconButton
                  key="undo"
                  overlay
                  disabled={!history.canUndo}
                  label={t('Undo', { note: 'recipe.calc.undo' })}
                  onClick={history.onUndo}
                >
                  <Undo2 className="size-3.5" />
                </IconButton>,
                <IconButton
                  key="redo"
                  overlay
                  disabled={!history.canRedo}
                  label={t('Redo', { note: 'recipe.calc.redo' })}
                  onClick={history.onRedo}
                >
                  <Redo2 className="size-3.5" />
                </IconButton>,
              ]
            : []),
          <IconButton
            key="relayout"
            overlay
            label={t('Auto layout', { note: 'recipe.calc.relayout' })}
            onClick={onRelayout}
          >
            <RotateCcw className="size-3.5" />
          </IconButton>,
          ...(onAddNote
            ? [
                <IconButton
                  key="note"
                  overlay
                  label={t('Add note', { note: 'recipe.calc.note_add' })}
                  onClick={onAddNote}
                >
                  <StickyNote className="size-3.5" />
                </IconButton>,
              ]
            : []),
        ]}
        zoom={{
          onZoomIn,
          onZoomOut,
          onFit,
        }}
        extra={actions}
      />
    </ViewerToolbar>
  );
}

