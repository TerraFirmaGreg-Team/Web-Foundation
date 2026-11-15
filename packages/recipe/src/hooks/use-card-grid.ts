import {
  boolCodec,
  createStoredValue,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';

const useStoredCardGrid = createStoredValue(
  'wiki.recipe.cardGrid',
  boolCodec(false),
);

export function useCardGrid() {
  const [grid, setGrid] = useStoredCardGrid();
  return { grid, setGrid };
}
