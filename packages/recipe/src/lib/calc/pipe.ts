import { stackIdBase } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type {
  CalcMaterial,
  CalcNode,
  CalcNodeInput,
  CalcPipe,
} from '@terrafirmagreg-team/recipe/types/calc';

export function pipeEndMatches(
  input: CalcNodeInput,
  out: CalcMaterial,
): boolean {
  if (input.kind !== out.kind || !out.id) return false;
  if (input.id && stackIdBase(input.id) === stackIdBase(out.id)) return true;
  return (
    !!input.tagId &&
    !!input.members?.some((m) => stackIdBase(m) === stackIdBase(out.id))
  );
}

export function resolvePipeEnds(
  src: CalcNode,
  dst: CalcNode,
  pipe: CalcPipe,
): { inputIndex: number; outIndex: number } | null {
  const hinted = dst.inputs[pipe.input];
  if (hinted?.id) {
    const outIndex = src.outputs.findIndex((out) =>
      pipeEndMatches(hinted, out),
    );
    if (outIndex >= 0) return { inputIndex: pipe.input, outIndex };
  }
  for (let i = 0; i < dst.inputs.length; i += 1) {
    if (i === pipe.input) continue;
    const input = dst.inputs[i];
    if (!input?.id) continue;
    const outIndex = src.outputs.findIndex((out) =>
      pipeEndMatches(input, out),
    );
    if (outIndex >= 0) return { inputIndex: i, outIndex };
  }
  return null;
}
