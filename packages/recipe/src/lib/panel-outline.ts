type OutlineRect = { x: number; y: number; w: number; h: number };

type GroupOutline = {
  groupId: string;
  d: string;
};

const ptKey = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;
const edgeKey = (x1: number, y1: number, x2: number, y2: number) =>
  `${ptKey(x1, y1)}>${ptKey(x2, y2)}`;

export function groupOutlines(
  indicesByGroup: Map<string, number[]>,
  cols: number,
  cell: OutlineRect,
  gap: number,
  bounds?: { w: number; h: number },
  stroke = 0,
): GroupOutline[] {
  const pad = gap / 2;
  const inset = stroke / 2;
  const maxX = (bounds?.w ?? Number.POSITIVE_INFINITY) - inset;
  const maxY = (bounds?.h ?? Number.POSITIVE_INFINITY) - inset;
  const out: GroupOutline[] = [];
  for (const [groupId, indices] of indicesByGroup) {
    const cells = new Set(
      indices.map((i) => `${i % cols},${Math.floor(i / cols)}`),
    );
    const segs: [number, number, number, number][] = [];
    for (const i of indices) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = Math.max(cell.x + col * (cell.w + gap) - pad, inset);
      const y = Math.max(cell.y + row * (cell.h + gap) - pad, inset);
      const w =
        Math.min(cell.x + col * (cell.w + gap) + cell.w + pad, maxX) - x;
      const h =
        Math.min(cell.y + row * (cell.h + gap) + cell.h + pad, maxY) - y;
      if (!cells.has(`${col},${row - 1}`)) segs.push([x, y, x + w, y]);
      if (!cells.has(`${col},${row + 1}`)) segs.push([x, y + h, x + w, y + h]);
      if (!cells.has(`${col - 1},${row}`)) segs.push([x, y, x, y + h]);
      if (!cells.has(`${col + 1},${row}`)) segs.push([x + w, y, x + w, y + h]);
    }
    const adj = new Map<string, { x: number; y: number }[]>();
    for (const [x1, y1, x2, y2] of segs) {
      let a = adj.get(ptKey(x1, y1));
      if (!a) adj.set(ptKey(x1, y1), (a = []));
      a.push({ x: x2, y: y2 });
      let b = adj.get(ptKey(x2, y2));
      if (!b) adj.set(ptKey(x2, y2), (b = []));
      b.push({ x: x1, y: y1 });
    }
    const used = new Set<string>();
    for (const [x1, y1, x2, y2] of segs) {
      const forward = edgeKey(x1, y1, x2, y2);
      if (used.has(forward)) continue;
      used.add(forward);
      used.add(edgeKey(x2, y2, x1, y1));
      const loop: [number, number][] = [
        [x1, y1],
        [x2, y2],
      ];
      let cx = x2;
      let cy = y2;
      while (cx !== x1 || cy !== y1) {
        const next = (adj.get(ptKey(cx, cy)) ?? []).find(
          (p) => !used.has(edgeKey(cx, cy, p.x, p.y)),
        );
        if (!next) break;
        used.add(edgeKey(cx, cy, next.x, next.y));
        used.add(edgeKey(next.x, next.y, cx, cy));
        loop.push([next.x, next.y]);
        cx = next.x;
        cy = next.y;
      }
      if (loop.length > 2) {
        out.push({
          groupId,
          d: `M${loop.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L')} Z`,
        });
      }
    }
  }
  return out;
}

