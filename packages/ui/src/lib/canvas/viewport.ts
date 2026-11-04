import type { StoredViewport } from '@terrafirmagreg-team/ui/types/canvas';

export const VIEWPORT_SAVE_MS = 300;
export const FLOW_MIN_ZOOM = 0.25;
export const FLOW_MAX_ZOOM = 2;

export function readStoredViewport(key: string): StoredViewport | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredViewport>;
    if (
      typeof parsed.x !== 'number' ||
      typeof parsed.y !== 'number' ||
      typeof parsed.zoom !== 'number' ||
      !Number.isFinite(parsed.x) ||
      !Number.isFinite(parsed.y) ||
      !Number.isFinite(parsed.zoom)
    ) {
      return null;
    }
    return { x: parsed.x, y: parsed.y, zoom: parsed.zoom };
  } catch {
    return null;
  }
}

export function writeStoredViewport(
  key: string,
  viewport: StoredViewport,
): void {
  try {
    localStorage.setItem(key, JSON.stringify(viewport));
  } catch {

  }
}

