'use client';

import { useMemo } from 'react';

export function usePagedList<T>(
  items: readonly T[],
  pageIndex: number,
  pageSize: number,
) {
  return useMemo(() => {
    const size = Math.max(1, Math.floor(pageSize) || 1);
    const pages = Math.max(1, Math.ceil(items.length / size));
    const raw = Number.isFinite(pageIndex) ? Math.floor(pageIndex) : 0;
    const page = Math.max(0, Math.min(raw, pages - 1));
    const shown = items.slice(page * size, (page + 1) * size);
    const from = items.length ? page * size + 1 : 0;
    const to = Math.min(items.length, (page + 1) * size);
    return { page, pages, shown, from, to, total: items.length };
  }, [items, pageIndex, pageSize]);
}

