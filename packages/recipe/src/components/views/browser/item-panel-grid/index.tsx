'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { memo } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { PanelCell } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel-grid/cell';
import { useMountLimit } from '@terrafirmagreg-team/recipe/hooks/use-mount-limit';
import { useGroupOutlines } from '@terrafirmagreg-team/recipe/hooks/use-group-outlines';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { FavoriteHoverTarget } from '@terrafirmagreg-team/recipe/lib/favorite-hover';
import type { ItemPanelCell, RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

const CELL = 36;

export const ItemPanelGrid = memo(function ItemPanelGrid({
  cells,
  resetKey,
  dataset,
  lang,
  names,
  nav,
  cols,
  rows,
  favIds,
  onPress,
  onHover,
  onToggleGroup,
  draggableStacks,
}: {
  cells: ItemPanelCell[];

  resetKey: unknown;
  dataset: DatasetRef;
  lang: Lang;
  names: Record<string, Record<string, string>>;
  nav: RecipeHrefOpts;
  cols: number;
  rows: number;
  favIds?: ReadonlySet<string>;
  onPress: (id: string, ref?: 'item' | 'fluid') => void;
  onHover?: (target: FavoriteHoverTarget | undefined) => void;
  onToggleGroup?: (id: string) => void;
  draggableStacks?: boolean;
}) {
  const t = useTranslations();
  const expandLabel = t('Expand', { note: 'recipe.expand' });
  const limit = useMountLimit(cells.length, resetKey);
  const shown = limit >= cells.length ? cells : cells.slice(0, limit);
  const { gridRef, outlines } = useGroupOutlines(shown, cols, rows);

  return (
    <ul
      ref={gridRef}
      className="relative grid h-full w-full place-content-center gap-1"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
        gridTemplateRows: `repeat(${rows}, ${CELL}px)`,
      }}
    >
      {shown.map((cell) => (
        <PanelCell
          key={cell.kind === 'recipe' ? `R:${cell.fav.id}` : cell.id}
          cell={cell}
          dataset={dataset}
          lang={lang}
          names={names}
          nav={nav}
          favIds={favIds}
          expandLabel={expandLabel}
          draggableStacks={draggableStacks}
          onPress={onPress}
          onHover={onHover}
          onToggleGroup={onToggleGroup}
        />
      ))}
      {Array.from({ length: cells.length - shown.length }, (_, i) => (
        <li
          key={`skel-${i}`}
          aria-hidden
          className="flex min-h-0 min-w-0 items-center justify-center"
        >
          <Skeleton className="size-9 rounded-sm" />
        </li>
      ))}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        {outlines.map((outline) => (
          <path
            key={outline.groupId + outline.d}
            d={outline.d}
            fill="none"
            stroke="var(--color-foreground)"
            strokeOpacity={0.4}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </ul>
  );
});

