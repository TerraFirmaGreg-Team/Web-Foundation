import { resolveQuestShapeId } from './id';

function gearClipPolygon(teeth = 8): string {
  const pts: string[] = [];
  const cx = 50;
  const cy = 50;
  const outer = 48;
  const inner = 32;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2 - Math.PI / 2;
    const step = (Math.PI * 2) / teeth;
    const rings: Array<[number, number]> = [
      [a + step * 0.12, inner],
      [a + step * 0.32, outer],
      [a + step * 0.68, outer],
      [a + step * 0.88, inner],
    ];
    for (const [angle, radius] of rings) {
      pts.push(
        `${(cx + Math.cos(angle) * radius).toFixed(2)}% ${(cy + Math.sin(angle) * radius).toFixed(2)}%`,
      );
    }
  }
  return `polygon(${pts.join(', ')})`;
}

const GEAR_CLIP = gearClipPolygon();

export function questShapeClip(shape?: string | null): string | undefined {
  const id = resolveQuestShapeId(shape);
  if (!id || id === 'none') return undefined;
  switch (id) {
    case 'square':
      return 'inset(0)';
    case 'rsquare':
      return 'inset(0 round 22%)';
    case 'circle':
      return 'circle(50%)';
    case 'diamond':
      return 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)';
    case 'hexagon':
      return 'polygon(50% 0, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)';
    case 'octagon':
      return 'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)';
    case 'pentagon':
      return 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)';
    case 'heart':
      return 'polygon(50% 92%, 6% 42%, 6% 22%, 26% 8%, 50% 26%, 74% 8%, 94% 22%, 94% 42%)';
    case 'gear':
      return GEAR_CLIP;
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

export function questShapeRadiusClass(shape?: string | null): string {
  const id = resolveQuestShapeId(shape);
  if (!id || id === 'none') return 'rounded-none';
  switch (id) {
    case 'square':
      return 'rounded-none';
    case 'rsquare':
      return 'rounded-md';
    case 'circle':
      return 'rounded-full';
    case 'gear':
    case 'diamond':
    case 'hexagon':
    case 'octagon':
    case 'pentagon':
    case 'heart':
      return 'rounded-none';
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

export function questShapeHasChrome(shape?: string | null): boolean {
  const id = resolveQuestShapeId(shape);
  return id != null && id !== 'none';
}

