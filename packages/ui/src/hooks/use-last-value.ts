'use client';

import { useState } from 'react';

export function useLastValue<T>(
  value: T | undefined,
  key?: string,
): T | undefined {
  const [held, setHeld] = useState<{ key?: string; value: T } | undefined>();
  const stale = held === undefined || held.key !== key;
  if (value !== undefined && (stale || !Object.is(held?.value, value))) {
    setHeld({ key, value });
  }
  return value ?? (stale ? undefined : held?.value);
}

