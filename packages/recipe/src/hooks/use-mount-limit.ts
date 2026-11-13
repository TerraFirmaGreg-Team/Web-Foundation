'use client';

import { useEffect, useState } from 'react';

export function useMountLimit(
  length: number,
  resetKey: unknown,
  eager = false,
): number {
  const [limit, setLimit] = useState(() => (eager ? length : 40));
  const [lastKey, setLastKey] = useState(resetKey);
  if (lastKey !== resetKey) {
    setLastKey(resetKey);
    setLimit(eager ? length : 40);
  } else if (eager && limit < length) {
    setLimit(length);
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

