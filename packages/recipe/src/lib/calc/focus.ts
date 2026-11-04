type Listener = (materialId: string) => void;

const listeners = new Set<Listener>();

export function requestCalcFocus(materialId: string): void {
  for (const listener of listeners) listener(materialId);
}

export function onCalcFocusRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

