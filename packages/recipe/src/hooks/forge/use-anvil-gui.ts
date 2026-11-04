'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { useSyncExternalStore } from 'react';
import {
  dumpLocation,
  dumpPublicUrl,
  subscribeDumpLocations,
} from '@terrafirmagreg-team/dump/lib/dump/paths';

export const ANVIL_GUI_REL = 'assets/tfc/textures/gui/anvil.webp';

export function useAnvilGui(dataset: DatasetRef): string | undefined {
  useSyncExternalStore(subscribeDumpLocations, () => dumpLocation(dataset));
  return dumpPublicUrl(dataset, ANVIL_GUI_REL);
}

