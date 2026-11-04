import type { QuestShapeId } from '@terrafirmagreg-team/quest/types';

const KNOWN_SHAPES: ReadonlySet<string> = new Set([
  'circle',
  'square',
  'rsquare',
  'diamond',
  'hexagon',
  'octagon',
  'pentagon',
  'heart',
  'gear',
  'none',
]);

export function resolveQuestShapeId(
  shape?: string | null,
): QuestShapeId | undefined {
  const trimmed = shape?.trim();
  if (!trimmed || trimmed === 'default') return undefined;
  if (!KNOWN_SHAPES.has(trimmed)) return undefined;
  return trimmed as QuestShapeId;
}

