export function formatFluidAmount(count: number): string {
  if (!Number.isFinite(count)) return String(count);
  if (Math.abs(count) >= 1000) {
    const buckets = count / 1000;
    const rounded =
      Math.abs(buckets) >= 100
        ? Math.trunc(buckets)
        : Math.round(buckets * 10) / 10;
    return `${String(rounded).replace(/\.0$/, '')}B`;
  }
  return `${Math.trunc(count)}mB`;
}

export function formatCount(value: number, roundAt = 10_000): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs < roundAt) return String(Math.trunc(value));
  const units: [number, string][] = [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'k'],
  ];
  for (const [div, suffix] of units) {
    if (abs >= div) {
      const rounded = value / div;
      const text =
        Math.abs(rounded) >= 100
          ? String(Math.trunc(rounded))
          : String(Math.round(rounded * 10) / 10).replace(/\.0$/, '');
      return `${text}${suffix}`;
    }
  }
  return String(value);
}

