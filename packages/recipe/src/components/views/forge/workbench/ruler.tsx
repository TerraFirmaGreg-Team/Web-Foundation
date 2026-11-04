'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { MARK_PROGRESS, MARK_TARGET, GuiSprite } from '@terrafirmagreg-team/recipe/components/views/forge/gui';
import { RULER, useRuler } from '@terrafirmagreg-team/recipe/hooks/forge/use-ruler';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ForgeState } from '@terrafirmagreg-team/recipe/hooks/forge/use-forge-state';

export function RulerOverlay({
  atlas,
  scale,
  panelRef,
  state,
}: {
  atlas: string | undefined;
  scale: number;
  panelRef: React.RefObject<HTMLDivElement | null>;
  state: ForgeState;
}) {
  const t = useTranslations();
  const PX = (v: number) => v * scale;
  const { work, target, solving, setStart, setTarget, setTargetInput } = state;
  const {
    dragging,
    beginDrag,
    onRulerDown,
    onRulerMove,
    onRulerUp,
    onHandleKey,
  } = useRuler({
    panelRef,
    scale,
    work,
    target,
    solving,
    onWork: setStart,
    onTarget: setTarget,
  });

  const markerHandles = [
    { kind: 'target', value: target ?? 0, label: t('Target', { note: 'recipe.forge.target' }) },
    { kind: 'work', value: work, label: t('Current work', { note: 'recipe.forge.current' }) },
  ] as const;

  return (
    <>
      <GuiSprite
        gui={atlas}
        rect={MARK_PROGRESS}
        scale={scale}
        className={cn(
          'pointer-events-none absolute',
          !dragging && 'transition-[left] duration-200',
        )}
        style={{ left: PX(RULER.markerX + work), top: PX(100) }}
      />
      <GuiSprite
        gui={atlas}
        rect={MARK_TARGET}
        scale={scale}
        className={cn(
          'pointer-events-none absolute',
          !dragging && 'transition-[left] duration-200',
        )}
        style={{ left: PX(RULER.markerX + (target ?? 0)), top: PX(94) }}
      />
      <div
        role="slider"
        aria-label={t('Work ruler', { note: 'recipe.forge.ruler' })}
        aria-valuemin={0}
        aria-valuemax={149}
        aria-valuenow={target ?? work}
        aria-disabled={solving}
        tabIndex={0}
        className={cn(
          'absolute touch-none',
          solving ? 'cursor-not-allowed' : 'cursor-ew-resize',
        )}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const step = event.shiftKey ? 10 : 1;
          const value = Math.max(
            0,
            Math.min(
              149,
              (target ?? work) + (event.key === 'ArrowRight' ? step : -step),
            ),
          );
          setTargetInput(String(value));
        }}
        style={{
          left: PX(4),
          top: PX(RULER.numbersTop - 2),
          width: PX(168),
          height: PX(RULER.trackBottom - RULER.numbersTop + 4),
        }}
        onPointerDown={onRulerDown}
        onPointerMove={onRulerMove}
        onPointerUp={onRulerUp}
        onPointerCancel={onRulerUp}
      />
      {markerHandles.map(({ kind, value, label }) => (
        <div
          key={kind}
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={149}
          aria-valuenow={value}
          aria-disabled={solving}
          tabIndex={0}
          className={cn(
            'absolute touch-none rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
            solving ? 'cursor-not-allowed' : 'cursor-grab',
          )}
          onKeyDown={onHandleKey(kind)}
          onPointerDown={(event) => beginDrag(event, kind)}
          onPointerMove={onRulerMove}
          onPointerUp={onRulerUp}
          onPointerCancel={onRulerUp}
          style={{
            left: PX(RULER.markerX + value + 2.5 - 6),
            top: PX(RULER.numbersTop - 2),
            width: PX(12),
            height: PX(RULER.trackBottom - RULER.numbersTop + 4),
          }}
        />
      ))}
    </>
  );
}

