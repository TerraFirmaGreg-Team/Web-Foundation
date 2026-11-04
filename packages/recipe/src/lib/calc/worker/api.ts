import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import type { FlushHandler, ResolveInput } from './protocol';
import { runResolve } from './resolve';
import { resetWorkerState, state } from './state';

export const api = {
  async init(
    nextDataset: DatasetRef,
    nextCatalog: RecipeCompactIndex,
    flushHandler: FlushHandler,
  ) {
    resetWorkerState(nextDataset, nextCatalog);
    state.onFlush = flushHandler;
  },
  async resolve(input: ResolveInput) {
    state.resolveGen += 1;
    await runResolve(input);
  },
  async invalidate() {
    state.resolveGen += 1;
    state.epoch += 1;
  },
};

