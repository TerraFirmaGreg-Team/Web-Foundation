'use client';
import {
  readStoredValue,
  subscribeStoredValue,
  writeStoredValue,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';
import {
  readabilityLayouts,
  spotlightStyles,
  type ReadabilityLayout,
  type ReadabilityState,
  type SpotlightStyle,
} from '@terrafirmagreg-team/ui/types/readability';

const STORAGE = 'readability';
const WIDTH_MIN = 60;
const WIDTH_MAX = 100;
const WIDTH_DEBOUNCE_MS = 1000;
const ANIM_DURATION_MS = 5000;

export const defaults: ReadabilityState = {
  layout: 'full',
  pageWidth: 100,
  contentWidth: 80,
  spotlight: false,
  spotlightStyle: 'aside',
};

let cached: ReadabilityState = defaults;

export function getServerSnapshot() {
  return defaults;
}

function snapshot(next: ReadabilityState): ReadabilityState {
  if (
    cached.layout === next.layout &&
    cached.pageWidth === next.pageWidth &&
    cached.contentWidth === next.contentWidth &&
    cached.spotlight === next.spotlight &&
    cached.spotlightStyle === next.spotlightStyle
  ) {
    return cached;
  }
  cached = next;
  return cached;
}

export function subscribe(onStoreChange: () => void) {
  return subscribeStoredValue(STORAGE, onStoreChange);
}

function isLayout(value: unknown): value is ReadabilityLayout {
  return readabilityLayouts.includes(value as ReadabilityLayout);
}

function isSpotlightStyle(value: unknown): value is SpotlightStyle {
  return spotlightStyles.includes(value as SpotlightStyle);
}

export function clampWidth(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, Math.round(n)));
}

export function readState(): ReadabilityState {
  return snapshot(
    readStoredValue(STORAGE, (raw) => {
      if (!raw) return defaults;
      try {
        const parsed = JSON.parse(raw) as Partial<ReadabilityState>;
        return {
          layout: isLayout(parsed.layout) ? parsed.layout : defaults.layout,
          pageWidth: clampWidth(parsed.pageWidth, defaults.pageWidth),
          contentWidth: clampWidth(parsed.contentWidth, defaults.contentWidth),
          spotlight: parsed.spotlight === true,
          spotlightStyle: isSpotlightStyle(parsed.spotlightStyle)
            ? parsed.spotlightStyle
            : defaults.spotlightStyle,
        };
      } catch {
        return defaults;
      }
    }),
  );
}

export function writeState(patch: Partial<ReadabilityState>) {
  writeStoredValue(
    STORAGE,
    { ...readState(), ...patch },
    JSON.stringify,
  );
}

let widthTimer: ReturnType<typeof setTimeout> | undefined;
let animTimer: ReturnType<typeof setTimeout> | undefined;
let initialized = false;

function writeWidths(state: ReadabilityState) {
  const root = document.documentElement;
  root.style.setProperty('--readability-page-width', `${state.pageWidth}%`);
  root.style.setProperty('--readability-content-width', `${state.contentWidth}%`);
}

function applyWidths(state: ReadabilityState) {
  clearTimeout(widthTimer);
  widthTimer = setTimeout(() => writeWidths(state), WIDTH_DEBOUNCE_MS);
}

function triggerAnimation() {
  const root = document.documentElement;
  root.setAttribute('data-readability-anim', '');
  clearTimeout(animTimer);
  animTimer = setTimeout(() => {
    root.removeAttribute('data-readability-anim');
  }, ANIM_DURATION_MS);
}

export function applyState(state: ReadabilityState) {
  const root = document.documentElement;
  root.dataset.layout = state.layout;
  root.toggleAttribute('data-spotlight', state.spotlight);
  root.dataset.spotlightStyle = state.spotlightStyle;
  if (!initialized) {
    initialized = true;
    writeWidths(state);
    return;
  }
  applyWidths(state);
  triggerAnimation();
}

export function clearState() {
  const root = document.documentElement;
  initialized = false;
  clearTimeout(widthTimer);
  clearTimeout(animTimer);
  delete root.dataset.layout;
  delete root.dataset.spotlightStyle;
  root.removeAttribute('data-spotlight');
  root.removeAttribute('data-readability-anim');
  root.style.removeProperty('--readability-page-width');
  root.style.removeProperty('--readability-content-width');
}

