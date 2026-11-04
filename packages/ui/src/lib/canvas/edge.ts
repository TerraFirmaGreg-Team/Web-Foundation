import type {
  ChevronEdgeHighlight,
  FlowPoint,
} from '@terrafirmagreg-team/ui/types/canvas';

export const CHEVRON_SPACING = 10;
const CHEVRON_SIZE = 3.5;

export const CHEVRON_GLYPH = `M${-CHEVRON_SIZE * 0.45} ${-CHEVRON_SIZE * 0.9}L${CHEVRON_SIZE} 0L${-CHEVRON_SIZE * 0.45} ${CHEVRON_SIZE * 0.9}`;

export function chevronTicksAlongPath(points: readonly FlowPoint[]): {
  offsets: number[];
  total: number;
} {
  let total = 0;
  for (let i = 0; i + 1 < points.length; i += 1) {
    total += Math.hypot(
      points[i + 1]!.x - points[i]!.x,
      points[i + 1]!.y - points[i]!.y,
    );
  }
  const offsets: number[] = [];
  for (
    let d = CHEVRON_SPACING;
    d <= total - CHEVRON_SPACING / 2;
    d += CHEVRON_SPACING
  ) {
    offsets.push(d);
  }
  return { offsets, total };
}

export function svgPathToPoints(d: string, samples = 12): FlowPoint[] {
  const out: FlowPoint[] = [];
  const re = /([MLCQ])([^MLCQ]*)/g;
  let match: RegExpExecArray | null;
  let cur: FlowPoint = { x: 0, y: 0 };
  while ((match = re.exec(d))) {
    const nums = match[2]!.trim().split(/[\s,]+/).map(Number);
    if (match[1] === 'M' || match[1] === 'L') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        cur = { x: nums[i]!, y: nums[i + 1]! };
        out.push(cur);
      }
    } else if (match[1] === 'C') {
      for (let i = 0; i + 5 < nums.length; i += 6) {
        const p0 = cur;
        const c1 = { x: nums[i]!, y: nums[i + 1]! };
        const c2 = { x: nums[i + 2]!, y: nums[i + 3]! };
        const p1 = { x: nums[i + 4]!, y: nums[i + 5]! };
        for (let s = 1; s <= samples; s += 1) {
          const t = s / samples;
          const mt = 1 - t;
          out.push({
            x:
              mt * mt * mt * p0.x +
              3 * mt * mt * t * c1.x +
              3 * mt * t * t * c2.x +
              t * t * t * p1.x,
            y:
              mt * mt * mt * p0.y +
              3 * mt * mt * t * c1.y +
              3 * mt * t * t * c2.y +
              t * t * t * p1.y,
          });
        }
        cur = p1;
      }
    } else if (match[1] === 'Q') {
      for (let i = 0; i + 3 < nums.length; i += 4) {
        const p0 = cur;
        const c = { x: nums[i]!, y: nums[i + 1]! };
        const p1 = { x: nums[i + 2]!, y: nums[i + 3]! };
        for (let s = 1; s <= samples; s += 1) {
          const t = s / samples;
          const mt = 1 - t;
          out.push({
            x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
            y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y,
          });
        }
        cur = p1;
      }
    }
  }
  return out;
}

export function chamferedPolylinePath(
  points: readonly FlowPoint[],
  cut = 8,
): string {
  if (!points.length) return '';
  if (points.length < 3) {
    return `M${points[0]!.x} ${points[0]!.y}${points
      .slice(1)
      .map((p) => `L${p.x} ${p.y}`)
      .join('')}`;
  }
  let d = `M${points[0]!.x} ${points[0]!.y}`;
  let cursor = points[0]!;
  for (let i = 1; i + 1 < points.length; i += 1) {
    const corner = points[i]!;
    const next = points[i + 1]!;
    const inLen = Math.hypot(corner.x - cursor.x, corner.y - cursor.y);
    const outLen = Math.hypot(next.x - corner.x, next.y - corner.y);
    const take = Math.min(cut, inLen / 2, outLen / 2);
    if (take < 0.5) {
      d += `L${corner.x} ${corner.y}`;
      cursor = corner;
      continue;
    }
    const ax = corner.x - ((corner.x - cursor.x) / inLen) * take;
    const ay = corner.y - ((corner.y - cursor.y) / inLen) * take;
    const bx = corner.x + ((next.x - corner.x) / outLen) * take;
    const by = corner.y + ((next.y - corner.y) / outLen) * take;
    d += `L${ax} ${ay}L${bx} ${by}`;
    cursor = { x: bx, y: by };
  }
  const last = points[points.length - 1]!;
  return `${d}L${last.x} ${last.y}`;
}

export function roundedPolylinePath(
  points: readonly FlowPoint[],
  radius = 10,
): string {
  if (!points.length) return '';
  if (points.length < 3) {
    return `M${points[0]!.x} ${points[0]!.y}${points
      .slice(1)
      .map((p) => `L${p.x} ${p.y}`)
      .join('')}`;
  }
  let d = `M${points[0]!.x} ${points[0]!.y}`;
  let cursor = points[0]!;
  for (let i = 1; i + 1 < points.length; i += 1) {
    const corner = points[i]!;
    const next = points[i + 1]!;
    const inLen = Math.hypot(corner.x - cursor.x, corner.y - cursor.y);
    const outLen = Math.hypot(next.x - corner.x, next.y - corner.y);
    const take = Math.min(radius, inLen / 2, outLen / 2);
    if (take < 0.5) {
      d += `L${corner.x} ${corner.y}`;
      cursor = corner;
      continue;
    }
    const ax = corner.x - ((corner.x - cursor.x) / inLen) * take;
    const ay = corner.y - ((corner.y - cursor.y) / inLen) * take;
    const bx = corner.x + ((next.x - corner.x) / outLen) * take;
    const by = corner.y + ((next.y - corner.y) / outLen) * take;
    d += `L${ax} ${ay}Q${corner.x} ${corner.y} ${bx} ${by}`;
    cursor = { x: bx, y: by };
  }
  const last = points[points.length - 1]!;
  return `${d}L${last.x} ${last.y}`;
}

export function nearestPointOnPolyline(
  points: readonly FlowPoint[],
  p: FlowPoint,
): FlowPoint {
  let best = points[0]!;
  let bestD = Infinity;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2
      ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
      : 0;
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return best;
}

export function chevronHighlightClass(
  highlight: ChevronEdgeHighlight,
): string {
  switch (highlight) {
    case 'incoming':
      return 'chevron-edge--incoming';
    case 'outgoing':
      return 'chevron-edge--outgoing';
    case 'dim':
      return 'chevron-edge--dim';
    case undefined:
      return '';
    default: {
      const _never: never = highlight;
      return _never;
    }
  }
}

