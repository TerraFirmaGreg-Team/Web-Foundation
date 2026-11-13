const listeners = new Set<() => void>();

export function onTooltipDismiss(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dismissOpenTooltips() {
  for (const listener of [...listeners]) listener();
}
