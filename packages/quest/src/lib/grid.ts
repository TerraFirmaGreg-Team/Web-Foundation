import type { Quest } from '@terrafirmagreg-team/quest/lib/data/dto';

export const DEFAULT_GRID_SCALE = 0.5;
export const DEFAULT_QUEST_NODE_SIZE = 1;
export const DEFAULT_QUEST_SPACING = 1;
export const QUEST_ZOOM_BASE = 1;

const QUEST_ICON_INNER_RATIO = 2 / 3;
const GRID_SIZE = 24;

export function gridToPx(value: number, gridScale = DEFAULT_GRID_SCALE): number {
  const scale = gridScale > 0 ? gridScale : DEFAULT_GRID_SCALE;
  return value * (GRID_SIZE / scale);
}

export function gridStepPx(gridScale = DEFAULT_GRID_SCALE): number {
  const scale = gridScale > 0 ? gridScale : DEFAULT_GRID_SCALE;
  return GRID_SIZE / scale;
}

function questButtonCellRatio(
  questSpacing = DEFAULT_QUEST_SPACING,
): number {
  const button = 1.5;
  const cell = button + questSpacing / 4;
  return button / cell;
}

function questIconPx(
  size = DEFAULT_QUEST_NODE_SIZE,
  gridScale = DEFAULT_GRID_SCALE,
  questSpacing = DEFAULT_QUEST_SPACING,
): number {
  const questSize = Number(size) > 0 ? Number(size) : DEFAULT_QUEST_NODE_SIZE;
  return Math.round(
    gridStepPx(gridScale) * questButtonCellRatio(questSpacing) * questSize,
  );
}

export function questIconInnerPx(outerPx: number): number {
  return Math.round(outerPx * QUEST_ICON_INNER_RATIO);
}

export function questNodeOuterPx(
  quest: Pick<Quest, 'size'>,
  gridScale: number,
  questSpacing = DEFAULT_QUEST_SPACING,
): number {
  return questIconPx(quest.size, gridScale, questSpacing);
}

