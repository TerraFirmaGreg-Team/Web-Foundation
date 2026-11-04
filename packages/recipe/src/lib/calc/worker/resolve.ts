import { fetchWanted } from './fetch';
import { createFlush, postFlush } from './flush';
import type { ResolveInput } from './protocol';
import { state } from './state';

export async function runResolve(input: ResolveInput) {
  const gen = state.resolveGen;
  const pending = createFlush();
  const wantedRecipes = new Set(
    (input.recipes ?? []).filter(
      (id) => id && !state.recipeMap.has(id) && !state.deadIds.has(id),
    ),
  );
  const wantedOut = new Set(
    (input.materials ?? []).filter((id) => id && !state.outMap.has(id)),
  );
  const wantedTag = new Set(
    (input.tags ?? []).filter((id) => id && !state.tagMap.has(id)),
  );
  for (let iter = 0; iter < 50; iter += 1) {
    if (gen !== state.resolveGen) return;
    if (!wantedRecipes.size && !wantedOut.size && !wantedTag.size) break;
    const progressed = await fetchWanted(
      pending,
      wantedRecipes,
      wantedOut,
      wantedTag,
      state.recipeMap,
    );
    if (gen !== state.resolveGen) return;
    if (!progressed) break;
    for (const id of input.tags ?? []) {
      if (id && !state.tagMap.has(id)) wantedTag.add(id);
    }
    wantedRecipes.forEach((id) => {
      if (state.recipeMap.has(id) || state.deadIds.has(id)) {
        wantedRecipes.delete(id);
      }
    });
    wantedOut.forEach((id) => {
      if (state.outMap.has(id)) wantedOut.delete(id);
    });
    wantedTag.forEach((id) => {
      if (state.tagMap.has(id)) wantedTag.delete(id);
    });
  }
  postFlush(pending);
}

