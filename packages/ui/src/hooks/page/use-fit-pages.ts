'use client';

import { useMemo, type RefObject } from 'react';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';

export type FitDim = { w: number; h: number };

type FitPageList<T> = {
  page: number;
  pages: number;
  shown: T[];
  to: number;
  total: number;
  measured: boolean;
  box: FitDim;
};

export function useFitPages<T>(
  boxRef: RefObject<HTMLElement | null>,
  items: readonly T[],
  dim: (item: T, box: FitDim) => FitDim,
  urlPage: number,
  gap = 8,
  focus?: number,
  vertical = false,
): FitPageList<T> {
  const { w, h } = useElementSize(boxRef);
  return useMemo(() => {
    const measured = w > 0 && h > 0;
    const box: FitDim = { w, h };
    if (!measured) {
      return {
        page: 0,
        pages: 1,
        shown: [],
        to: 0,
        total: items.length,
        measured,
        box,
      };
    }

    const packed: T[][] = [];
    let page: T[] = [];
    let shelfW = 0;
    let shelfH = 0;
    let usedH = 0;
    let focusPage = -1;
    items.forEach((item, i) => {
      const d = dim(item, box);
      const iw = vertical ? w : Math.max(1, d.w);
      const ih = Math.max(1, d.h);
      if (shelfW > 0 && shelfW + gap + iw > w) {
        usedH += shelfH + (usedH > 0 ? gap : 0);
        shelfW = 0;
        shelfH = 0;
        if (usedH + gap + ih > h && page.length) {
          packed.push(page);
          page = [];
          usedH = 0;
        }
      }
      shelfW = shelfW === 0 ? iw : shelfW + gap + iw;
      shelfH = Math.max(shelfH, ih);
      if (focus === i) focusPage = packed.length;
      page.push(item);
    });
    if (page.length) packed.push(page);
    if (!packed.length) packed.push([]);

    const raw = Number.isFinite(urlPage) ? Math.floor(urlPage) : 0;
    const clamped =
      focusPage >= 0
        ? focusPage
        : Math.max(0, Math.min(raw, packed.length - 1));
    let to = 0;
    for (let i = 0; i <= clamped && i < packed.length; i += 1) {
      to += packed[i].length;
    }
    return {
      page: clamped,
      pages: packed.length,
      shown: packed[clamped],
      to,
      total: items.length,
      measured,
      box,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dim is item-keyed
  }, [items, w, h, urlPage, gap, focus, vertical]);
}

