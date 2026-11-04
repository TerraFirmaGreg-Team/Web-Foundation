import type { FlowPoint } from '@terrafirmagreg-team/ui/types/canvas';
import { CELL } from './geometry';

export function simplifyCells(
  cells: number[][],
  walkable: (x: number, y: number) => boolean,
): number[][] {

  const runClear = (ax: number, ay: number, bx: number, by: number) => {
    const dx = Math.sign(bx - ax);
    const dy = Math.sign(by - ay);
    for (let x = ax, y = ay; ; x += dx, y += dy) {
      if (!walkable(x, y)) return false;
      if (x === bx && y === by) return true;
    }
  };
  const corner = (a: number[], b: number[]) => {
    for (const c of [
      [b[0]!, a[1]!],
      [a[0]!, b[1]!],
    ]) {
      if (runClear(a[0]!, a[1]!, c[0]!, c[1]!) && runClear(c[0]!, c[1]!, b[0]!, b[1]!)) {
        return c;
      }
    }
    return null;
  };
  const out: number[][] = [cells[0]!];
  let i = 0;
  while (i < cells.length - 1) {

    for (let j = cells.length - 1; j > i; j -= 1) {
      const c = corner(cells[i]!, cells[j]!);
      if (!c) continue;
      const last = out[out.length - 1]!;
      if ((c[0] !== last[0] || c[1] !== last[1]) && (c[0] !== cells[j]![0] || c[1] !== cells[j]![1])) {
        out.push(c);
      }
      out.push(cells[j]!);
      i = j;
      break;
    }
  }
  return out;
}

export function cellsToPolyline(
  cells: number[][],
  sa: FlowPoint,
  sb: FlowPoint,
): FlowPoint[] {
  const px = cells.map(([cx, cy]) => ({
    x: (cx + 0.5) * CELL,
    y: (cy + 0.5) * CELL,
  }));
  if (!px.length) return [];

  const n = px.length;
  if (n >= 3) {
    const snap = (p: FlowPoint, q: FlowPoint, s: FlowPoint) =>
      p.y === q.y ? { x: q.x, y: s.y } : { x: s.x, y: q.y };
    px[1] = snap(px[0]!, px[1]!, sa);
    if (n - 2 > 1) px[n - 2] = snap(px[n - 1]!, px[n - 2]!, sb);
  }
  px[0] = sa;
  px[n - 1] = sb;
  return px;
}

export function orthoPoints(points: FlowPoint[]): FlowPoint[] {
  let prevAxis: 'h' | 'v' = 'h';
  const out: FlowPoint[] = [points[0]!];
  for (let i = 1; i < points.length; i += 1) {
    const prev = out[out.length - 1]!;
    const cur = points[i]!;
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (dx !== 0 && dy !== 0) {
      const elbow =
        prevAxis === 'h' ? { x: cur.x, y: prev.y } : { x: prev.x, y: cur.y };
      out.push(elbow);
      prevAxis = prevAxis === 'h' ? 'v' : 'h';
    } else {
      prevAxis = dx !== 0 ? 'h' : 'v';
    }
    if (cur.x !== out[out.length - 1]!.x || cur.y !== out[out.length - 1]!.y) {
      out.push(cur);
    }
  }

  const clean: FlowPoint[] = [out[0]!];
  for (let i = 1; i < out.length - 1; i += 1) {
    const p = clean[clean.length - 1]!;
    const c = out[i]!;
    const n = out[i + 1]!;
    const collinear =
      (p.x === c.x && c.x === n.x) || (p.y === c.y && c.y === n.y);
    if (!collinear) clean.push(c);
  }
  if (out.length > 1) clean.push(out[out.length - 1]!);
  return clean;
}

