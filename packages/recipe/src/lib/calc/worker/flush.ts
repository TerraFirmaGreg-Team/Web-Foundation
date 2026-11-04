import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';
import type {
  CalcRecipe,
  TagResolution,
} from '@terrafirmagreg-team/recipe/types/calc';
import { state } from './state';

export function createFlush() {
  return {
    out: new Map<string, RecipeCompactRow[]>(),
    tag: new Map<string, TagResolution>(),
    recipes: new Map<string, CalcRecipe>(),
    bodies: new Map<string, Recipe>(),
    dead: new Set<string>(),
    dirty: false,
  };
}

export type Pending = ReturnType<typeof createFlush>;

export function postFlush(pending: Pending) {
  if (!pending.dirty) return;
  pending.dirty = false;
  state.onFlush({
    epoch: state.epoch,
    out: [...pending.out],
    tag: [...pending.tag],
    recipes: [...pending.recipes],
    bodies: [...pending.bodies],
    dead: [...pending.dead],
  });
  pending.out.clear();
  pending.tag.clear();
  pending.recipes.clear();
  pending.bodies.clear();
  pending.dead.clear();
}

