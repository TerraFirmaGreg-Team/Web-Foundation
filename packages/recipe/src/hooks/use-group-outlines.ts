'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { groupOutlines } from '@terrafirmagreg-team/recipe/lib/browser/panel-outline';
import type { ItemPanelCell } from '@terrafirmagreg-team/recipe/types';

const CELL = 36;
const GAP = 4;

export function useGroupOutlines(
  shown: ItemPanelCell[],
  cols: number,
  rows: number,
) {
  const gridRef = useRef<HTMLUListElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>();

  const indicesByGroup = useMemo(() => {
    const map = new Map<string, number[]>();
    shown.forEach((cell, index) => {
      const id =
        cell.kind === 'group'
          ? cell.expanded
            ? cell.id
            : undefined
          : cell.kind === 'stack'
            ? cell.groupId
            : undefined;
      if (!id) return;
      const list = map.get(id);
      if (list) list.push(index);
      else map.set(id, [index]);
    });
    return map;
  }, [shown]);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev && prev.w === rect.width && prev.h === rect.height
          ? prev
          : { w: rect.width, h: rect.height },
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const outlines = useMemo(() => {
    if (!size || !indicesByGroup.size) return [];
    const cell = {
      x: (size.w - (cols * CELL + (cols - 1) * GAP)) / 2,
      y: (size.h - (rows * CELL + (rows - 1) * GAP)) / 2,
      w: CELL,
      h: CELL,
    };
    return groupOutlines(indicesByGroup, cols, cell, GAP, size, 1.5);
  }, [size, indicesByGroup, cols, rows]);

  return { gridRef, outlines };
}

