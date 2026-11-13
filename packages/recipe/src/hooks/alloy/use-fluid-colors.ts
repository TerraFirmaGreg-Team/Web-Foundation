'use client';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useEffect, useMemo, useReducer } from 'react';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import { lookupSpriteInBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import { atlasPagePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { splitDumpId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import type { RecipeSlotFill } from '@terrafirmagreg-team/recipe/lib/data/dto';

const loadAtlasPage = createAsyncCache(
  async (url: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const done = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error(`atlas page failed to load: ${url}`));
    });
    image.src = url;
    return done;
  },
);

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  if (max === min) return [0, 0, l];
  const d = (max - min) / 255;
  const s = l > 0.5 ? d / (2 - (max + min) / 255) : d / ((max + min) / 255);
  let h = 0;
  if (max === r) h = ((g - b) / 255 / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / 255 / d + 2) / 6;
  else h = ((r - g) / 255 / d + 4) / 6;
  return [h, s, l];
}

function displayColor(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  const sat = Math.min(0.85, s);
  const light = Math.min(0.78, Math.max(0.25, l));
  return `hsl(${Math.round(h * 360)} ${Math.round(sat * 100)}% ${Math.round(light * 100)}%)`;
}

const loadFluidColor = createDatasetCache(
  async (dataset: DatasetRef, id: string): Promise<string | null> => {
    const parts = splitDumpId(id);
    if (!parts) return null;
    const bundle = await loadClientModAtlases(dataset, parts.ns);
    const hit = lookupSpriteInBundle(bundle, { id, kind: 'fluid' });
    if (!hit) return null;
    const url = atlasPagePublicUrl(dataset, hit.atlas, hit.page);
    if (!url) return null;
    const { sprite } = hit;
    const image = await loadAtlasPage(url);
    const canvas = document.createElement('canvas');
    canvas.width = sprite.w;
    canvas.height = sprite.h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(
      image,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      0,
      0,
      sprite.w,
      sprite.h,
    );
    const { data } = ctx.getImageData(0, 0, sprite.w, sprite.h);
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
    return n ? displayColor(r / n, g / n, b / n) : null;
  },
  (dataset, id) => datasetCacheKey(dataset, id),
);

export function useFluidColors(
  dataset: DatasetRef,
  slots: readonly (RecipeSlotFill | { id: string; kind?: string })[],
): (string | undefined)[] {
  const ids = useMemo(
    () =>
      slots.map((slot) =>
        slot && (slot.kind === 'fluid' || !slot.kind) ? slot.id : null,
      ),
    [slots],
  );
  const [bump, force] = useReducer((v: number) => v + 1, 0);
  useEffect(() => {
    let live = true;
    const pending = ids.filter(
      (id): id is string => !!id && loadFluidColor.peek(dataset, id) === undefined,
    );
    if (pending.length) {
      Promise.allSettled(
        pending.map((id) => loadFluidColor(dataset, id)),
      ).then(() => {
        if (live) force();
      });
    }
    return () => {
      live = false;
    };
  }, [dataset, ids]);
  void bump;
  return ids.map((id) =>
    id ? (loadFluidColor.peek(dataset, id) ?? undefined) : undefined,
  );
}
