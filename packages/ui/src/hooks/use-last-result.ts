'use client';

import { useState } from 'react';

export function useLastResult<T>(result: {
  value: T | undefined;
  pending: boolean;
  error: unknown;
}, key?: string): {
  value: T | undefined;
  stale: boolean;
  pending: boolean;
  error: unknown;
} {
  const [held, setHeld] = useState<{ key?: string; value: T } | undefined>();
  const keyMismatch = held !== undefined && held.key !== key;
  if (
    result.value !== undefined &&
    (keyMismatch || !Object.is(held?.value, result.value))
  ) {
    setHeld({ key, value: result.value });
  }
  const value = result.value ?? (keyMismatch ? undefined : held?.value);
  return {
    value,
    stale: value !== undefined && result.value === undefined,
    pending: result.pending && value === undefined,
    error: result.error,
  };
}
