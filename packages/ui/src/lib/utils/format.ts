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

