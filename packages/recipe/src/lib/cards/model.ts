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

const COUNT_TEXT = /^x?(\d[\d\s.,]*)?\s*(mB|k|B|L|M)?$/i;

export function slotOverlay(
  widget: RecipeTextWidget,
  slots: RecipeSlotWidget[],
): RecipeSlotWidget | undefined {
  return slots.find(
    (slot) => widget.x + widget.w > slot.x && widget.x < slot.x + slot.w,
  );
}

export function countCoveredText(
  widget: RecipeTextWidget,
  slots: RecipeSlotWidget[],
): boolean {
  const match = widget.text
    .replace(/§./g, '')
    .trim()
    .match(COUNT_TEXT);
  if (!match?.[1]) return false;
  const num = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(num)) return false;
  const unit = (match[2] ?? '').toLowerCase();
  const scales =
    unit === 'b' || unit === 'l'
      ? [1000, 1e9]
      : unit === 'k'
        ? [1000]
        : unit === 'm'
          ? [1e6]
          : [1];
  return slots.some(
    (slot) =>
      slot.count !== undefined &&
      scales.some(
        (scale) =>
          Math.abs(num * scale - slot.count!) <=
          Math.max(1, num * scale * 0.01),
      ) &&
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

export function slotCoveredLabel(
  widget: RecipeTextWidget,
  slots: RecipeSlotWidget[],
): RecipeSlotWidget | undefined {
  if (widget.text.replace(/§./g, '').trim() !== 'NC') return undefined;
  return slotOverlay(widget, slots);
}

