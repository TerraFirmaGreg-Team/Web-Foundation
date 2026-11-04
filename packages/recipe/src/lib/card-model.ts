import type {
  RecipeSlotWidget,
  RecipeTextWidget,
} from '@terrafirmagreg-team/recipe/lib/data/dto';

export type CardStripGeo = {
  slots: RecipeSlotWidget[];
  top: number;
  bottom: number;
  right: number;
  overflow: boolean;
  patchBottom: number;
  barTop: number;
};

export function cardStripGeo(
  slots: RecipeSlotWidget[],
  contentGuiW: number,
  innerBottomGui: number,
  margin: number,
): CardStripGeo {
  const stripSlots = slots.filter((slot) => slot.role === 'renderOnly');
  const top = stripSlots.length
    ? Math.min(...stripSlots.map((slot) => slot.y))
    : 0;
  const bottom = stripSlots.length
    ? Math.max(...stripSlots.map((slot) => slot.y + slot.h))
    : 0;
  const right = stripSlots.length
    ? Math.max(...stripSlots.map((slot) => slot.x + slot.w))
    : 0;
  const overflow = right > contentGuiW + 1;
  const patchBottom = Math.min(
    bottom + margin + 16,
    Math.max(innerBottomGui - 1, 0),
  );
  const barTop = Math.min(bottom + margin + 1, Math.max(innerBottomGui - 5, 0));
  return { slots: stripSlots, top, bottom, right, overflow, patchBottom, barTop };
}

export function countCoveredText(
  widget: RecipeTextWidget,
  stripSlots: RecipeSlotWidget[],
): boolean {
  return stripSlots.some(
    (slot) =>
      slot.count !== undefined &&
      String(slot.count) === widget.text &&
      widget.x + widget.w > slot.x &&
      widget.x < slot.x + slot.w,
  );
}

export function textInStrip(
  widget: RecipeTextWidget,
  geo: CardStripGeo,
): boolean {
  return (
    geo.overflow &&
    widget.y + widget.h > geo.top &&
    widget.y < geo.bottom &&
    widget.x < geo.right
  );
}

