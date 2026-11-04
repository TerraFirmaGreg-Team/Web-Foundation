import { PAD, type Rect } from './geometry';

const BUCKET = 512;

export function createRectBuckets(
  rects: Iterable<Rect>,
): (x0: number, y0: number, x1: number, y1: number) => Rect[] {
  const buckets = new Map<string, Rect[]>();
  for (const rect of rects) {
    const x0 = Math.floor((rect.x - PAD) / BUCKET);
    const x1 = Math.floor((rect.x + rect.w + PAD) / BUCKET);
    const y0 = Math.floor((rect.y - PAD) / BUCKET);
    const y1 = Math.floor((rect.y + rect.h + PAD) / BUCKET);
    for (let bx = x0; bx <= x1; bx += 1) {
      for (let by = y0; by <= y1; by += 1) {
        const key = `${bx},${by}`;
        (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(rect);
      }
    }
  }
  return (x0, y0, x1, y1) => {
    const seen = new Set<Rect>();
    for (
      let bx = Math.floor(x0 / BUCKET);
      bx <= Math.floor(x1 / BUCKET);
      bx += 1
    ) {
      for (
        let by = Math.floor(y0 / BUCKET);
        by <= Math.floor(y1 / BUCKET);
        by += 1
      ) {
        for (const rect of buckets.get(`${bx},${by}`) ?? []) {
          if (
            !seen.has(rect) &&
            rect.x - PAD < x1 &&
            rect.x + rect.w + PAD > x0 &&
            rect.y - PAD < y1 &&
            rect.y + rect.h + PAD > y0
          ) {
            seen.add(rect);
          }
        }
      }
    }
    return [...seen];
  };
}

