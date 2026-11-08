import type {
  CalcMaterial,
  CalcNode,
  CalcNodeInput,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';

export function wireEndMatches(
  input: CalcNodeInput,
  out: CalcMaterial,
): boolean {
  if (input.kind !== out.kind || !out.id) return false;
  if (input.id === out.id) return true;
  return !!input.tagId && !!input.members?.includes(out.id);
}

export function resolveWireEnds(
  src: CalcNode,
  dst: CalcNode,
  wire: CalcWire,
): { inputIndex: number; outIndex: number } | null {
  const hinted = dst.inputs[wire.input];
  if (hinted?.id) {
    const outIndex = src.outputs.findIndex((out) =>
      wireEndMatches(hinted, out),
    );
    if (outIndex >= 0) return { inputIndex: wire.input, outIndex };
  }
  for (let i = 0; i < dst.inputs.length; i += 1) {
    if (i === wire.input) continue;
    const input = dst.inputs[i];
    if (!input?.id) continue;
    const outIndex = src.outputs.findIndex((out) =>
      wireEndMatches(input, out),
    );
    if (outIndex >= 0) return { inputIndex: i, outIndex };
  }
  return null;
}
