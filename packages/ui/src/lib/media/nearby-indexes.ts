export function nearbyIndexes(selected: number, length: number): number[] {
  if (length <= 1) return [0];
  const next = (selected + 1) % length;
  const prev = (selected - 1 + length) % length;
  return next === prev ? [selected, next] : [selected, next, prev];
}

