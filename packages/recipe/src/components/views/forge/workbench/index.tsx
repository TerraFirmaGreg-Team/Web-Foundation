'use client';

import { useRef } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';
import { GUI_PANEL, GuiSprite } from '@terrafirmagreg-team/recipe/components/views/forge/gui';
import { useAnvilGui } from '@terrafirmagreg-team/recipe/hooks/forge/use-anvil-gui';
import { useForgeState } from '@terrafirmagreg-team/recipe/hooks/forge/use-forge-state';
import { WorkbenchControls } from './controls';
import { AnvilPanel } from './panel';
import { RulerOverlay } from './ruler';
import { StatusPlate } from './status';
import { StepTape } from './tape';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ForgeRecipe } from '@terrafirmagreg-team/recipe/types/forge';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

const S_MAX = 2.5;
const S_MIN = 1.5;

export function ForgeWorkbench({
  recipe,
  session,
}: {
  recipe: ForgeRecipe;
  session: RecipeSession;
}) {
  const t = useTranslations();
  const atlas = useAnvilGui(session.dataset);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { w: wrapW } = useElementSize(wrapRef);
  const S = wrapW
    ? Math.max(S_MIN, Math.min(S_MAX, Math.floor((wrapW / GUI_PANEL.w) * 4) / 4))
    : S_MAX;
  const PX = (v: number) => v * S;
  const state = useForgeState(recipe);
  const { finished } = state;

  return (
    <section className="space-y-3">
      {}
      <WorkbenchControls state={state} rulesSupported={recipe.rulesSupported} langMap={session.langMap} />
      {!recipe.rulesSupported ? (
        <p role="alert" className="text-sm text-destructive">
          {t('The dump contains missing or unrecognized forging rules. A safe solution cannot be calculated.', { note: 'recipe.forge.unsupported' })}
        </p>
      ) : null}

      {}
      <div
        ref={wrapRef}
        className="flex w-full flex-col items-center overflow-x-auto"
      >
        <div
          ref={panelRef}
          className={cn(
            'relative shrink-0 rounded-sm bg-muted shadow-inner transition-shadow duration-300',
            finished && 'shadow-[0_0_0_2px_rgb(63,185,80,0.5)]',
          )}
          style={{ width: PX(GUI_PANEL.w), height: PX(GUI_PANEL.h) }}
        >
          <GuiSprite
            gui={atlas}
            rect={GUI_PANEL}
            scale={S}
            className="absolute inset-0 rounded-sm"
          />
          <AnvilPanel atlas={atlas} scale={S} recipe={recipe} state={state} langMap={session.langMap} />
          <RulerOverlay
            atlas={atlas}
            scale={S}
            panelRef={panelRef}
            state={state}
          />
        </div>

        <StatusPlate state={state} scale={S} />
      </div>

      <StepTape atlas={atlas} state={state} />
    </section>
  );
}

