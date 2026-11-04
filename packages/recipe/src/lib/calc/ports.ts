export const PORT_SIZE = 20;
export const PORT_GAP = 2;
export const PORT_STEP = PORT_SIZE + PORT_GAP;
export const PORT_OUT = PORT_SIZE / 2;
export const PORT_IN = PORT_OUT + 2;

export const railSpans = new Map<
  string,
  {
    inStart?: number;
    inRows?: number;
    outStart?: number;
    outRows?: number;
  }
>();

export function portAnchorPoint(
  node: { position: { x: number; y: number }; width?: number; height?: number },
  side: 'src' | 'tgt',
  index = 0,
  count = 1,
): { x: number; y: number } {
  const w = node.width ?? 0;
  const h = node.height ?? 0;
  const span =
    'id' in node && typeof node.id === 'string'
      ? railSpans.get(node.id)
      : undefined;
  const start = (side === 'tgt' ? span?.inStart : span?.outStart) ?? 0;
  const measured = side === 'tgt' ? span?.inRows : span?.outRows;
  const maxRows = Math.max(1, Math.floor((h - 4) / PORT_STEP));
  const rows = Math.max(1, Math.min(count, measured ?? maxRows));
  const row = Math.max(
    0,
    Math.min(index - start + (start > 0 ? 1 : 0), rows - 1),
  );
  const sign = side === 'src' ? 1 : -1;
  return {
    x: node.position.x + sign * (w / 2),
    y: node.position.y + (row - (rows - 1) / 2) * PORT_STEP,
  };
}

