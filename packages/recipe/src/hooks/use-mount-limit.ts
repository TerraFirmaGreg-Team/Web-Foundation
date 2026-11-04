'use client';

import { useEffect, useState } from 'react';

export function useMountLimit(length: number, resetKey: unknown): number {
  const [limit, setLimit] = useState(40);
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setLimit(40);
  }
  useEffect(() => {
    if (limit >= length) return;
    const timer = setInterval(
      () => setLimit((prev) => Math.min(prev + 40, length)),
      16,
    );
    return () => clearInterval(timer);
  }, [length, limit]);
  return limit;
}

