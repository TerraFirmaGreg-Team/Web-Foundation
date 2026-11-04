import { boolCodec, createStoredValue } from '@terrafirmagreg-team/ui/lib/utils/stored-value';

const useStoredHideUnused = createStoredValue(
  'wiki.recipe.hideUnused',
  boolCodec(false),
);

export function useHideUnused() {
  const [hideUnused, setHideUnused] = useStoredHideUnused();
  return { hideUnused, setHideUnused };
}

