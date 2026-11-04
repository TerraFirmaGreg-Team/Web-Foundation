import type { AlloyComponent, AlloyMixRow } from '@terrafirmagreg-team/recipe/types/alloy';

export const INGOT_MB = 144;

const MAX_INGOT_BATCH = 128;

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export function ingotRatioMix(
  components: readonly AlloyComponent[],
): { counts: number[]; total: number } | null {
  const scaled = components.map(({ slot }) => Math.round(slot.amount * 100));
  if (!scaled.length || scaled.some((value) => value <= 0)) return null;
  const divisor = scaled.reduce(gcd);
  const counts = scaled.map((value) => value / divisor);
  const total = counts.reduce((sum, value) => sum + value, 0);
  return total <= MAX_INGOT_BATCH ? { counts, total } : null;
}

function componentsOk(
  components: readonly AlloyComponent[],
): components is readonly (AlloyComponent & { slot: { amount: number } })[] {
  return (
    components.length > 0 &&
    components.every(
      ({ slot }) => Number.isFinite(slot.amount) && slot.amount > 0,
    )
  );
}

function distributeUnits(shares: readonly number[], total: number): number[] {
  const units = Math.max(1, Math.round(total));
  const floors = shares.map((share) => Math.floor(share));
  const leftover = units - floors.reduce((sum, value) => sum + value, 0);
  const order = shares
    .map((share, i) => [share - floors[i], i] as const)
    .sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < leftover && order.length; i++) {
    floors[order[i % order.length][1]]++;
  }
  return floors;
}

export function suggestAmounts(
  components: readonly AlloyComponent[],
  total: number,
): number[] | null {
  if (!componentsOk(components) || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  const sum = components.reduce((value, { slot }) => value + slot.amount, 0);
  if (!Number.isFinite(sum) || sum <= 0) return null;
  const units = Math.round(total);
  if (units <= 0) return null;
  return distributeUnits(
    components.map(({ slot }) => (units * slot.amount) / sum),
    units,
  );
}

export function scaleAmounts(
  amounts: readonly number[],
  total: number,
): number[] | null {
  const sum = amounts.reduce((value, amount) => value + Math.max(0, amount), 0);
  if (!Number.isFinite(total) || total <= 0 || sum <= 0) return null;
  const units = Math.round(total);
  if (units <= 0) return null;
  return distributeUnits(
    amounts.map((amount) => (Math.max(0, amount) / sum) * units),
    units,
  );
}

export function checkMix(
  components: readonly AlloyComponent[],
  amounts: readonly number[],
): { total: number; output: number; rows: AlloyMixRow[]; valid: boolean } {
  const total = amounts.reduce((sum, value) => sum + Math.max(0, value), 0);
  const rows = components.map((component, i) => {
    const amount = Math.max(0, amounts[i] ?? 0);
    const percent = total > 0 ? (amount / total) * 100 : 0;
    const { range } = component;
    const valid =
      !range ||
      (percent >= range.min - 1e-8 && percent <= range.max + 1e-8);
    return { ...component, amount, percent, valid };
  });
  return {
    total,
    output: total,
    rows,
    valid: total > 0 && rows.every((row) => row.valid),
  };
}

export function snapToIngots(
  components: readonly AlloyComponent[],
  amounts: readonly number[],
): number[] | null {
  const count = components.length;
  if (!count) return null;
  const lows = components.map((_, i) =>
    Math.max(0, Math.round((amounts[i] ?? 0) / INGOT_MB) - 1),
  );
  let best: number[] | null = null;
  let bestDiff = Infinity;
  for (let code = 0, limit = 3 ** count; code < limit; code++) {
    let rest = code;
    const snapped = new Array<number>(count);
    for (let i = 0; i < count; i++) {
      snapped[i] = (lows[i] + (rest % 3)) * INGOT_MB;
      rest = Math.floor(rest / 3);
    }
    if (!checkMix(components, snapped).valid) continue;
    const diff = snapped.reduce(
      (sum, value, i) => sum + Math.abs(value - (amounts[i] ?? 0)),
      0,
    );
    if (diff < bestDiff) {
      bestDiff = diff;
      best = snapped;
    }
  }
  return best;
}

export function minShareMix(
  components: readonly AlloyComponent[],
  index: number,
  total: number,
): number[] | null {
  const range = components[index]?.range;
  if (
    !range ||
    !componentsOk(components) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return null;
  }
  const units = Math.round(total);

  const pinned = Math.max(1, Math.ceil((units * range.min) / 100));
  const rest = units - pinned;
  if (rest <= 0) return null;
  const restSum = components.reduce(
    (sum, { slot }, i) => sum + (i === index ? 0 : slot.amount),
    0,
  );
  const shares = components.map(({ slot }, i) =>
    i === index ? 0 : (rest * slot.amount) / restSum,
  );
  const dist = distributeUnits(shares, rest);
  dist[index] = pinned;
  return dist;
}

export function minimalAdditions(
  components: readonly AlloyComponent[],
  amounts: readonly number[],
): number[] | null {
  if (!componentsOk(components)) return null;
  const next = components.map((_, i) => Math.max(0, amounts[i] ?? 0));
  for (let pass = 0; pass < 256; pass++) {
    const { rows, valid } = checkMix(components, next);
    if (valid) return next.map((value, i) => value - Math.max(0, amounts[i] ?? 0));
    const over = rows.filter((row) => row.range && row.percent > row.range.max);
    const under = rows.filter((row) => row.range && row.percent < row.range.min);
    const total = rows.reduce((sum, row) => sum + row.amount, 0);

    if (over.length && !under.length) {

      const extra = over[0];
      const neededTotal = (next[rows.indexOf(extra)] * 100) / extra.range!.max;
      const room = rows.filter(
        (row) => !over.includes(row) && (!row.range || row.percent < row.range.max),
      );
      if (!room.length) return null;
      const target = room.sort(
        (a, b) =>
          (b.range?.max ?? Infinity) - b.percent -
          ((a.range?.max ?? Infinity) - a.percent),
      )[0];
      const index = rows.indexOf(target);
      if (!target.range) {
        next[index] += neededTotal - total;
        continue;
      }
      const addNeed = neededTotal - total;
      const addMax =
        (target.range.max * total - 100 * next[index]) / (100 - target.range.max);
      next[index] += Math.max(Math.ceil(Math.min(addNeed, addMax)), 1);
      continue;
    }

    const target = under.sort(
      (a, b) => a.percent - a.range!.min - (b.percent - b.range!.min),
    )[0];
    if (!target) return null;
    const index = rows.indexOf(target);
    const add =
      (target.range!.min * total - 100 * next[index]) / (100 - target.range!.min);
    next[index] += Math.max(Math.ceil(add), 1);
  }
  return null;
}

