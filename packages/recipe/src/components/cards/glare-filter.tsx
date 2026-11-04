import type { CSSProperties } from 'react';

export const RECIPE_GLARE_FILTER_ID = 'recipe-glare-cut';

export const recipeGlareFilter: CSSProperties = {
  filter: `url(#${RECIPE_GLARE_FILTER_ID})`,
};

export function RecipeGlareFilter() {
  return (
    <svg aria-hidden className="absolute size-0 overflow-hidden">
      <defs>
        <filter
          id={RECIPE_GLARE_FILTER_ID}
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -2.946 -9.912 -1.001 13.44 0"
          />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0.03 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

