'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useCallback, useState } from 'react';

export function usePanelPage(_dataset: DatasetRef) {
  const [page, setPageState] = useState(0);
  const setPage = useCallback((next: number) => {
    setPageState(Math.max(0, Math.floor(next)));
  }, []);
  return { page, setPage };
}
