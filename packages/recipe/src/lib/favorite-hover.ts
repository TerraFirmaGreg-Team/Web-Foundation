export type FavoriteHoverTarget =
  | { kind: 'stack'; id: string; ref?: 'item' | 'fluid' }
  | { kind: 'recipe'; id: string; type: string; icon?: string };

export const favoriteHover: {
  base?: FavoriteHoverTarget;
  slot?: FavoriteHoverTarget;
} = {};

export function favoriteHoverTarget(): FavoriteHoverTarget | undefined {
  return favoriteHover.slot ?? favoriteHover.base;
}

