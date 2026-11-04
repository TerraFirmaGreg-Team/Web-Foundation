'use client';

import type { CSSProperties } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ForgeRule, ForgeRuleAction } from '@terrafirmagreg-team/recipe/types/forge';

const ATLAS_SIZE = 256;

export type GuiRect = { x: number; y: number; w: number; h: number };

function spriteStyle(
  gui: string,
  { x, y, w, h }: GuiRect,
  scale: number,
): CSSProperties {
  return {
    width: w * scale,
    height: h * scale,
    imageRendering: 'pixelated',
    backgroundImage: `url(${gui})`,
    backgroundSize: `${ATLAS_SIZE * scale}px ${ATLAS_SIZE * scale}px`,
    backgroundPosition: `-${x * scale}px -${y * scale}px`,
  };
}

function maskStyle(
  gui: string,
  { x, y, w, h }: GuiRect,
  scale: number,
): CSSProperties {
  const size = `${ATLAS_SIZE * scale}px ${ATLAS_SIZE * scale}px`;
  const position = `-${x * scale}px -${y * scale}px`;
  return {
    width: w * scale,
    height: h * scale,
    maskImage: `url(${gui})`,
    maskSize: size,
    maskPosition: position,
    maskRepeat: 'no-repeat',
    WebkitMaskImage: `url(${gui})`,
    WebkitMaskSize: size,
    WebkitMaskPosition: position,
    WebkitMaskRepeat: 'no-repeat',
  };
}

export function GuiSprite({
  gui,
  rect,
  scale = 1,
  className,
  style,
}: {
  gui: string | undefined;
  rect: GuiRect;
  scale?: number;
  className?: string;
  style?: CSSProperties;
}) {
  if (!gui) return null;
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0', className)}
      style={{ ...spriteStyle(gui, rect, scale), ...style }}
    />
  );
}

export function GuiMask({
  gui,
  rect,
  scale = 1,
  className,
  style,
}: {
  gui: string | undefined;
  rect: GuiRect;
  scale?: number;
  className?: string;
  style?: CSSProperties;
}) {
  if (!gui) return null;
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0', className)}
      style={{ ...maskStyle(gui, rect, scale), ...style }}
    />
  );
}

export const GUI_PANEL: GuiRect = { x: 0, y: 0, w: 176, h: 110 };

export const PLAN_SLOT: GuiRect = { x: 218, y: 0, w: 18, h: 18 };

export const RULE_OVERLAY_Y: Record<ForgeRule['order'], number> = {
  last: 0,
  second_last: 22,
  third_last: 44,
  not_last: 66,
  any: 88,
};

const STEP_GLYPH_X: Record<string, number> = {
  punch: 0,
  bend: 32,
  upset: 64,
  shrink: 96,
  light: 128,
  medium: 160,
  hard: 192,
  draw: 224,
};

export const RULE_ICON: Record<ForgeRuleAction, GuiRect> = {
  hit: { x: 218, y: 18, w: 32, h: 32 },
  draw: { x: 224, y: 224, w: 32, h: 32 },
  punch: { x: 0, y: 224, w: 32, h: 32 },
  bend: { x: 32, y: 224, w: 32, h: 32 },
  upset: { x: 64, y: 224, w: 32, h: 32 },
  shrink: { x: 96, y: 224, w: 32, h: 32 },
};

export const MARK_PROGRESS: GuiRect = { x: 176, y: 0, w: 5, h: 5 };
export const MARK_TARGET: GuiRect = { x: 181, y: 0, w: 5, h: 5 };

export function actionGlyphRect(action: string): GuiRect {
  return { x: STEP_GLYPH_X[action] ?? 0, y: 224, w: 32, h: 32 };
}

