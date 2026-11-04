import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import type {
  CalcCard,
  CalculatorState,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';

function encodeUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUrlSafe(encoded: string): string {
  let result = encoded;
  const pad = result.length % 4;
  if (pad) result += '='.repeat(4 - pad);
  return result.replace(/-/g, '+').replace(/_/g, '/');
}

function u8ToBinary(u8: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u8.length; i += 8192) {
    bin += String.fromCharCode(...u8.subarray(i, i + 8192));
  }
  return bin;
}

export function encodeCalcState(state: CalculatorState): string {
  const dict = new Map<string, number>();
  const ref = (id: string): number => {
    const hit = dict.get(id);
    if (hit !== undefined) return hit;
    const idx = dict.size;
    dict.set(id, idx);
    return idx;
  };
  const indexOf = new Map<string, number>();
  const cards = state.cards.map((card, index) => {
    indexOf.set(card.id, index);
    const row = [
      ref(card.materialId),
      card.kind === 'fluid' ? 1 : 0,
      card.recipeId ? ref(card.recipeId) : -1,
      card.crafts,
      Math.round(card.pos?.x ?? 0),
      Math.round(card.pos?.y ?? 0),
      card.pos ? 1 : 0,
    ];
    return row;
  });
  const wires = state.wires.flatMap((wire) => {
    const from = indexOf.get(wire.from);
    const to = indexOf.get(wire.to);
    return from === undefined || to === undefined
      ? []
      : [[from, to, wire.input, wire.out ?? 0, wire.amount ?? 0]];
  });
  const tagSelections: Record<string, number> = {};
  for (const [tagId, memberId] of Object.entries(state.tagSelections)) {
    if (memberId) tagSelections[String(ref(tagId))] = ref(memberId);
  }
  const payload = {
    v: 2,
    d: [...dict.keys()],
    c: cards,
    w: wires,
    g: tagSelections,
  };
  const packed = deflateSync(strToU8(JSON.stringify(payload)));
  return `x${encodeUrlSafe(btoa(u8ToBinary(packed)))}`;
}

export function decodeCalcState(encoded: string): CalculatorState | null {
  const text = encoded.trim();
  if (!text.startsWith('x')) return null;
  try {
    const bin = atob(decodeUrlSafe(text.slice(1)));
    const packed = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const payload = JSON.parse(strFromU8(inflateSync(packed))) as {
      v?: number;
      d?: string[];
      c?: number[][];
      w?: number[][];
      g?: Record<string, number>;
    };
    if (payload.v !== 2 || !Array.isArray(payload.d)) return null;
    const dict = payload.d;
    const id = (idx: unknown): string | null =>
      typeof idx === 'number' && idx >= 0 && idx < dict.length
        ? dict[idx]!
        : null;
    const cards: CalcCard[] = [];
    for (const [index, row] of (payload.c ?? []).entries()) {
      if (!Array.isArray(row)) continue;
      const materialId = id(row[0]);
      if (!materialId) continue;
      const kind = row[1] === 1 ? 'fluid' : 'item';
      const recipeId = row[2] === -1 ? null : id(row[2]);
      cards.push({
        id: `c${index}`,
        materialId,
        kind,
        recipeId: recipeId ?? null,
        crafts: Number(row[3]) || 1,
        pos:
          row[6] === 1
            ? { x: Number(row[4]) || 0, y: Number(row[5]) || 0 }
            : undefined,
      });
    }
    const wires: CalcWire[] = [];
    for (const row of payload.w ?? []) {
      if (!Array.isArray(row)) continue;
      const from = cards[row[0]!];
      const to = cards[row[1]!];
      if (!from || !to) continue;
      wires.push({
        from: from.id,
        to: to.id,
        input: Number(row[2]) || 0,
        out: Number(row[3]) || undefined,
        amount: Number(row[4]) || undefined,
      });
    }
    const tagSelections: Record<string, string> = {};
    for (const [tagIdx, memberIdx] of Object.entries(payload.g ?? {})) {
      const tagId = id(Number(tagIdx));
      const memberId = id(memberIdx);
      if (tagId && memberId) tagSelections[tagId] = memberId;
    }
    return { cards, wires, tagSelections };
  } catch {
    return null;
  }
}

