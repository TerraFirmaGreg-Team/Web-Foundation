import PF from 'pathfinding';
import type { Edge } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type { FlowPoint } from '@terrafirmagreg-team/ui/types/canvas';
import { createRectBuckets } from './buckets';
import {
  CELL,
  PAD,
  cellKey,
  keyX,
  keyY,
  portAnchor,
  toRect,
  zRoute,
  type Rect,
  type RouteNode,
} from './geometry';
import { cellsToPolyline, orthoPoints, simplifyCells } from './polyline';

const WINDOW = 160;

const MAX_CELLS = 200_000;

const STUB = 40;

function stubLength(
  from: FlowPoint,
  dir: 1 | -1,
  skip: Rect[],
  clear: (x0: number, y0: number, x1: number, y1: number) => Iterable<Rect>,
): number {
  let max = STUB;
  const end = from.x + dir * STUB;
  const x0 = Math.min(from.x, end) - 1;
  const x1 = Math.max(from.x, end) + 1;
  for (const rect of clear(x0, from.y - 1, x1, from.y + 1)) {
    if (skip.includes(rect)) continue;
    if (from.y < rect.y - PAD || from.y > rect.y + rect.h + PAD) continue;
    const edge = dir === 1 ? rect.x - PAD : rect.x + rect.w + PAD;
    const room = (edge - from.x) * dir;
    if (room < max) max = Math.max(0, room);
  }
  return max;
}

function growWindow(
  bounds: { x0: number; y0: number; x1: number; y1: number },
  query: (x0: number, y0: number, x1: number, y1: number) => Iterable<Rect>,
  pad: number,
): void {
  for (let i = 0; i < 4; i += 1) {
    let grew = false;
    for (const rect of query(bounds.x0, bounds.y0, bounds.x1, bounds.y1)) {
      const rx0 = rect.x - pad;
      const ry0 = rect.y - pad;
      const rx1 = rect.x + rect.w + pad;
      const ry1 = rect.y + rect.h + pad;
      if (rx0 < bounds.x0) { bounds.x0 = rx0; grew = true; }
      if (ry0 < bounds.y0) { bounds.y0 = ry0; grew = true; }
      if (rx1 > bounds.x1) { bounds.x1 = rx1; grew = true; }
      if (ry1 > bounds.y1) { bounds.y1 = ry1; grew = true; }
    }
    if (!grew) break;
  }
}

function detourRoute(
  a: FlowPoint,
  b: FlowPoint,
  sa: FlowPoint,
  sb: FlowPoint,
  skip: Rect[],
  query: (x0: number, y0: number, x1: number, y1: number) => Iterable<Rect>,
): FlowPoint[] {
  const bounds = {
    x0: Math.min(sa.x, sb.x),
    y0: Math.min(sa.y, sb.y),
    x1: Math.max(sa.x, sb.x),
    y1: Math.max(sa.y, sb.y),
  };
  growWindow(bounds, query, PAD);
  const laneAt = (off: number): FlowPoint[][] => [
    [sa, { x: bounds.x1 + off, y: sa.y }, { x: bounds.x1 + off, y: sb.y }, sb],
    [sa, { x: bounds.x0 - off, y: sa.y }, { x: bounds.x0 - off, y: sb.y }, sb],
    [sa, { x: sa.x, y: bounds.y0 - off }, { x: sb.x, y: bounds.y0 - off }, sb],
    [sa, { x: sa.x, y: bounds.y1 + off }, { x: sb.x, y: bounds.y1 + off }, sb],
  ];
  const clearLane = (lane: FlowPoint[]): number | null => {
    let len = 0;
    for (let i = 0; i + 1 < lane.length; i += 1) {
      const p = lane[i]!;
      const q = lane[i + 1]!;
      len += Math.abs(q.x - p.x) + Math.abs(q.y - p.y);
      const sx0 = Math.min(p.x, q.x) - 1;
      const sy0 = Math.min(p.y, q.y) - 1;
      const sx1 = Math.max(p.x, q.x) + 1;
      const sy1 = Math.max(p.y, q.y) + 1;
      for (const rect of query(sx0, sy0, sx1, sy1)) {
        if (skip.includes(rect)) continue;
        return null;
      }
    }
    return len;
  };
  for (let ring = 0; ring < 6; ring += 1) {
    const off = CELL * (ring === 0 ? 1 : 2 ** (ring + 1));
    let best: FlowPoint[] | null = null;
    let bestLen = Infinity;
    for (const lane of laneAt(off)) {
      const len = clearLane(lane);
      if (len !== null && len < bestLen) {
        bestLen = len;
        best = lane;
      }
    }
    if (best) return best;
    growWindow(bounds, query, PAD);
  }
  return zRoute(a, b, sa, sb).slice(1, -1);
}

type Committed = { keys: number[]; x0: number; y0: number; x1: number; y1: number };

type RouteEdge = Pick<Edge, 'id' | 'source' | 'target'> & {
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

type EdgeState = {
  points: FlowPoint[];
  a: FlowPoint;
  b: FlowPoint;
  committed?: Committed;
};

const samePoint = (a: FlowPoint, b: FlowPoint) => a.x === b.x && a.y === b.y;

const targetInput = (edge: RouteEdge) => {
  const handle = edge.targetHandle;
  const n = handle?.startsWith('in-') ? Number(handle.slice(3)) : 0;
  return Number.isFinite(n) ? n : 0;
};

const sourceOut = (edge: RouteEdge) => {
  const n = /^out-(\d+)$/.exec(edge.sourceHandle ?? '')?.[1];
  return n != null && Number.isFinite(Number(n)) ? Number(n) : 0;
};

export function createCircuitRouter(): (
  nodes: RouteNode[],
  edges: RouteEdge[],
) => Map<string, FlowPoint[]> {
  let prevEdges = new Map<string, EdgeState>();

  return (nodes, edges) => {
    const out = new Map<string, FlowPoint[]>();
    const nextEdges = new Map<string, EdgeState>();
    if (!edges.length) {
      prevEdges = nextEdges;
      return out;
    }

    const byId = new Map(nodes.map((node) => [node.id, node]));
    const rects = new Map(nodes.map((node) => [node.id, toRect(node)]));
    const rectsInWindow = createRectBuckets(rects.values());

    const committed: Committed[] = [];
    const used = new Set<number>();
    const pending: {
      edge: RouteEdge;
      s: RouteNode;
      t: RouteNode;
      a: FlowPoint;
      b: FlowPoint;
      dist: number;
    }[] = [];

    for (const edge of edges) {
      const s = byId.get(edge.source);
      const t = byId.get(edge.target);
      if (!s || !t) continue;
      const a = portAnchor(s, 'src', sourceOut(edge));
      const b = portAnchor(t, 'tgt', targetInput(edge));
      const prev = prevEdges.get(edge.id);
      if (prev && samePoint(prev.a, a) && samePoint(prev.b, b)) {
        out.set(edge.id, prev.points);
        nextEdges.set(edge.id, prev);
        if (prev.committed) {
          committed.push(prev.committed);
          for (const key of prev.committed.keys) used.add(key);
        }
        continue;
      }
      pending.push({
        edge,
        s,
        t,
        a,
        b,
        dist: Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
      });
    }

    pending.sort((x, y) => x.dist - y.dist || x.edge.id.localeCompare(y.edge.id));

    const finder = new PF.AStarFinder({
      diagonalMovement: PF.DiagonalMovement.Never,
    });

    for (const job of pending) {
      const { a, b } = job;

      const gap = b.x - a.x;
      if (gap > 0 && a.y === b.y) {
        const points = [a, b];
        out.set(job.edge.id, points);
        nextEdges.set(job.edge.id, { points, a, b });
        continue;
      }

      const sa = {
        x: a.x + stubLength(a, 1, [rects.get(job.s.id)!], rectsInWindow),
        y: a.y,
      };
      const sb = {
        x: b.x - stubLength(b, -1, [rects.get(job.t.id)!], rectsInWindow),
        y: b.y,
      };
      const bounds = {
        x0: Math.min(sa.x, sb.x) - WINDOW,
        y0: Math.min(sa.y, sb.y) - WINDOW,
        x1: Math.max(sa.x, sb.x) + WINDOW,
        y1: Math.max(sa.y, sb.y) + WINDOW,
      };
      growWindow(bounds, rectsInWindow, PAD + CELL);
      const wx0 = bounds.x0;
      const wy0 = bounds.y0;
      const wx1 = bounds.x1;
      const wy1 = bounds.y1;
      const ox = Math.floor(wx0 / CELL);
      const oy = Math.floor(wy0 / CELL);
      const gw = Math.ceil(wx1 / CELL) - ox + 1;
      const gh = Math.ceil(wy1 / CELL) - oy + 1;

      let cells: number[][] | null = null;
      let passGrid: InstanceType<typeof PF.Grid> | null = null;
      if (gw > 0 && gh > 0 && gw * gh <= MAX_CELLS) {
        const base = new PF.Grid(gw, gh);
        for (const rect of rectsInWindow(wx0, wy0, wx1, wy1)) {
          const rx0 = Math.max(0, Math.floor((rect.x - PAD) / CELL) - ox);
          const ry0 = Math.max(0, Math.floor((rect.y - PAD) / CELL) - oy);
          const rx1 = Math.min(
            gw - 1,
            Math.ceil((rect.x + rect.w + PAD) / CELL) - ox - 1,
          );
          const ry1 = Math.min(
            gh - 1,
            Math.ceil((rect.y + rect.h + PAD) / CELL) - oy - 1,
          );
          for (let cy = ry0; cy <= ry1; cy += 1) {
            for (let cx = rx0; cx <= rx1; cx += 1) {
              base.setWalkableAt(cx, cy, false);
            }
          }
        }
        const sCell = {
          x: Math.min(gw - 1, Math.max(0, Math.round(sa.x / CELL) - ox)),
          y: Math.min(gh - 1, Math.max(0, Math.round(sa.y / CELL) - oy)),
        };
        const tCell = {
          x: Math.min(gw - 1, Math.max(0, Math.round(sb.x / CELL) - ox)),
          y: Math.min(gh - 1, Math.max(0, Math.round(sb.y / CELL) - oy)),
        };
        let best: number[][] | null = null;
        let bestGrid: InstanceType<typeof PF.Grid> | null = null;
        for (let pass = 0; pass < 2; pass += 1) {
          const grid = base.clone();
          if (pass === 0) {
            for (const c of committed) {
              if (
                c.x1 < ox ||
                c.x0 > ox + gw - 1 ||
                c.y1 < oy ||
                c.y0 > oy + gh - 1
              ) {
                continue;
              }
              for (const key of c.keys) {
                const cx = keyX(key) - ox;
                const cy = keyY(key) - oy;
                if (cx >= 0 && cx < gw && cy >= 0 && cy < gh) {
                  grid.setWalkableAt(cx, cy, false);
                }
              }
            }
          }
          grid.setWalkableAt(sCell.x, sCell.y, true);
          grid.setWalkableAt(tCell.x, tCell.y, true);
          const path = finder.findPath(
            sCell.x,
            sCell.y,
            tCell.x,
            tCell.y,
            grid,
          );
          if (!path.length) continue;
          const mapped = path.map(([cx, cy]) => [cx + ox, cy + oy]);
          if (pass === 1) {
            if (best && best.length <= mapped.length * 1.34) break;
            best = mapped;
            bestGrid = grid;
            break;
          }
          best = mapped;
          bestGrid = grid;
        }
        cells = best;
        passGrid = bestGrid;
      }

      if (!cells || !passGrid) {
        const points = orthoPoints([
          a,
          ...detourRoute(
            a,
            b,
            sa,
            sb,
            [rects.get(job.s.id)!, rects.get(job.t.id)!],
            rectsInWindow,
          ),
          b,
        ]);
        out.set(job.edge.id, points);
        nextEdges.set(job.edge.id, { points, a, b });
        continue;
      }

      const g = passGrid;
      const simple = simplifyCells(
        cells,
        (x, y) =>
          x - ox >= 0 &&
          x - ox < gw &&
          y - oy >= 0 &&
          y - oy < gh &&
          g.isWalkableAt(x - ox, y - oy),
      );
      const polyline = cellsToPolyline(simple, sa, sb);
      const points = orthoPoints([a, sa, ...polyline, sb, b]);
      out.set(job.edge.id, points);

      const keys: number[] = [];
      let cx0 = Infinity;
      let cy0 = Infinity;
      let cx1 = -Infinity;
      let cy1 = -Infinity;
      const mark = (cx: number, cy: number) => {
        keys.push(cellKey(cx, cy));
        cx0 = Math.min(cx0, cx);
        cy0 = Math.min(cy0, cy);
        cx1 = Math.max(cx1, cx);
        cy1 = Math.max(cy1, cy);
      };
      for (let i = 0; i < simple.length - 1; i += 1) {
        const [fx, fy] = simple[i]!;
        const [tx, ty] = simple[i + 1]!;
        const dx = Math.sign(tx - fx);
        const dy = Math.sign(ty - fy);
        let cx = fx;
        let cy = fy;
        mark(cx, cy);
        while (cx !== tx || cy !== ty) {
          cx += dx;
          cy += dy;
          mark(cx, cy);
        }
      }
      for (const key of keys) used.add(key);
      const entry: Committed = {
        keys,
        x0: cx0 === Infinity ? 0 : cx0,
        y0: cy0 === Infinity ? 0 : cy0,
        x1: cx1 === -Infinity ? 0 : cx1,
        y1: cy1 === -Infinity ? 0 : cy1,
      };
      committed.push(entry);
      nextEdges.set(job.edge.id, { points, a: job.a, b: job.b, committed: entry });
    }

    prevEdges = nextEdges;
    return out;
  };
}

