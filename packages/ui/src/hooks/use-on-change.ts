import { useState } from 'react';

function isEqualShallow(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    !a ||
    !b ||
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    Object.is(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

export function useOnChange<T>(
  value: T,
  onChange: (current: T, previous: T) => void,
  isUpdated: (prev: T, current: T) => boolean = (a, b) =>
    !isEqualShallow(a, b),
) {
  const [prev, setPrev] = useState(value);
  if (isUpdated(prev, value)) {
    onChange(value, prev);
    setPrev(value);
  }
}

