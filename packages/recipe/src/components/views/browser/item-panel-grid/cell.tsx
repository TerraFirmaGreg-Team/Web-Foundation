'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { memo, type ReactNode } from 'react';
import { Minus, Plus, Star } from 'lucide-react';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { EntryGroup } from '@terrafirmagreg-team/game/components/entry/group';
import { CopyIdMenu } from '@terrafirmagreg-team/game/components/entry/copy-id-menu';
import { parseStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { formatNbt } from '@terrafirmagreg-team/dump/lib/snbt';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { Badge } from '@terrafirmagreg-team/ui/components/ui/badge';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { RecipeFavoriteCell } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel-grid/favorite-cell';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { EntrySize } from '@terrafirmagreg-team/game/types/entry';
import type { FavoriteHoverTarget } from '@terrafirmagreg-team/recipe/lib/browser/favorite-hover';
import type { ItemPanelCell, RecipeHrefOpts } from '@terrafirmagreg-team/recipe/types';

function PanelChip({
  id,
  size,
  className,
  badge,
  kind = 'item',
  names,
  lang,
  favIds,
}: {
  id: string;
  size: EntrySize;
  className?: string;
  badge?: { node: ReactNode; className?: string };
  kind?: 'item' | 'fluid';
  names: Record<string, Record<string, string>>;
  lang: Lang;
  favIds?: ReadonlySet<string>;
}) {
  return (
    <Entry
      id={id}
      kind={kind}
      name={recipeItemName(names, lang, id)}
      size={size}
      variant="chip"
      href={false}
      className={cn('block', className)}
      badge={
        badge?.node ??
        (favIds?.has(id) ? (
          <Star className="size-2.5 fill-amber-500 text-amber-500" />
        ) : undefined)
      }
      badgeClassName={
        badge?.className ?? '-left-0.5 -top-0.5 right-auto bottom-auto'
      }
    />
  );
}

export const PanelCell = memo(function PanelCell({
  cell,
  dataset,
  lang,
  names,
  nav,
  favIds,
  expandLabel,
  draggableStacks,
  onPress,
  onHover,
  onToggleGroup,
}: {
  cell: ItemPanelCell;
  dataset: DatasetRef;
  lang: Lang;
  names: Record<string, Record<string, string>>;
  nav: RecipeHrefOpts;
  favIds?: ReadonlySet<string>;
  expandLabel: string;
  draggableStacks?: boolean;
  onPress: (id: string, ref?: 'item' | 'fluid') => void;
  onHover?: (target: FavoriteHoverTarget | undefined) => void;
  onToggleGroup?: (id: string) => void;
}) {
  const stack = cell.kind === 'stack' ? cell.id : undefined;
  const parsed = stack ? parseStackId(stack) : undefined;
  const nbt = parsed ? formatNbt(parsed.nbt) : undefined;
  const hover: FavoriteHoverTarget | undefined =
    cell.kind === 'stack'
      ? {
          kind: 'stack',
          id: cell.id,
          ...(cell.ref ? { ref: cell.ref } : {}),
        }
      : cell.kind === 'recipe'
        ? {
            kind: 'recipe',
            id: cell.fav.id,
            type: cell.fav.type,
            ...(cell.fav.icon ? { icon: cell.fav.icon } : {}),
          }
        : undefined;
  return (
    <li
      className="flex min-h-0 min-w-0 items-center justify-center"
      onMouseEnter={() => onHover?.(hover)}
      onMouseLeave={() => onHover?.(undefined)}
    >
      {cell.kind === 'recipe' ? (
        <RecipeFavoriteCell
          dataset={dataset}
          lang={lang}
          names={names}
          nav={nav}
          fav={cell.fav}
        />
      ) : cell.kind === 'group' ? (
        <Hint label={cell.expanded ? undefined : expandLabel}>
          <button
            type="button"
            aria-label={cell.label}
            aria-pressed={cell.expanded}
            onClick={() => onToggleGroup?.(cell.id)}
            className="block rounded-sm"
          >
            <span className="relative flex size-9 items-center justify-center">
              <EntryGroup members={cell.members} size="lg" />
              <Badge className="absolute -right-0.5 -bottom-0.5 z-10 h-auto rounded-sm px-0.5 py-0 leading-tight">
                {cell.expanded ? (
                  <Minus className="size-3" />
                ) : (
                  <Plus className="size-3" />
                )}
              </Badge>
            </span>
          </button>
        </Hint>
      ) : (
        <CopyIdMenu id={parsed?.id ?? cell.id} nbt={nbt}>
          <button
            type="button"
            onClick={() => onPress(cell.id, cell.ref)}
            aria-label={recipeItemName(names, lang, cell.id)}
            className={cn('block rounded-sm', draggableStacks && 'cursor-grab')}
            draggable={draggableStacks || undefined}
            onDragStart={
              draggableStacks
                ? (event) => {
                    event.dataTransfer.setData(
                      'application/x-tfg-calc',
                      JSON.stringify({
                        id: cell.id,
                        kind: cell.ref === 'fluid' ? 'fluid' : 'item',
                      }),
                    );
                    event.dataTransfer.effectAllowed = 'copy';
                  }
                : undefined
            }
          >
            <PanelChip
              id={cell.id}
              size="lg"
              className="size-9"
              kind={cell.ref === 'fluid' ? 'fluid' : 'item'}
              names={names}
              lang={lang}
              favIds={favIds}
            />
          </button>
        </CopyIdMenu>
      )}
    </li>
  );
});

