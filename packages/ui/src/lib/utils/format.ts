export function formatFluidAmount(count: number): string {
  if (!Number.isFinite(count)) return String(count);
  const abs = Math.abs(count);
  if (abs < 1000) return `${Math.trunc(count)}mB`;
  const buckets = count / 1000;
  const absB = Math.abs(buckets);
  if (absB >= 999_000) return `${count < 0 ? '-' : ''}999kB+`;
  if (absB >= 1000) {
    const k = buckets / 1000;
    const text =
      Math.abs(k) >= 100
        ? String(Math.trunc(k))
        : String(Math.round(k * 10) / 10).replace(/\.0$/, '');
    return `${text}kB`;
  }
  const rounded =
    absB >= 100 ? Math.trunc(buckets) : Math.round(buckets * 10) / 10;
  return `${String(rounded).replace(/\.0$/, '')}B`;
}

export function formatCount(value: number, roundAt = 10_000): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs < roundAt) return String(Math.trunc(value));
  if (abs >= 999_000) return `${value < 0 ? '-' : ''}999k+`;
  if (abs >= 1_000) {
    const rounded = value / 1_000;
    const text =
      Math.abs(rounded) >= 100
        ? String(Math.trunc(rounded))
        : String(Math.round(rounded * 10) / 10).replace(/\.0$/, '');
    return `${text}k`;
  }
  return String(value);
}
