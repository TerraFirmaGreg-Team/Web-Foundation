'use client';

import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
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
  actions,
  ...view
}: {
  onFit: () => void;
  onRelayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  actions?: ReactNode;
  mode: CalcViewMode;
  onModeChange: (mode: CalcViewMode) => void;
  farCards: CalcFarMode;
  onFarCardsChange: (mode: CalcFarMode) => void;
}) {
  const t = useTranslations();
  return (
    <ViewerToolbar>
      <ViewerControls
        start={[
          <CalcViewMenu key="view" {...view} />,
          <IconButton
            key="relayout"
            overlay
            label={t('Auto layout', { note: 'recipe.calc.relayout' })}
            onClick={onRelayout}
          >
            <RotateCcw className="size-3.5" />
          </IconButton>,
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

