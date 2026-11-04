'use client';

import { useCallback } from 'react';
import {
  createStoredValue,
  type StoredCodec,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';
import type { FavoriteEntry, RecipeFavorite } from '@terrafirmagreg-team/recipe/types';

export type { FavoriteEntry, RecipeFavorite };

const LEGACY_ITEMS_KEY = 'wiki.recipe.favorites';
const LEGACY_RECIPES_KEY = 'wiki.recipe.favorites.recipes';

function legacyEntries(): FavoriteEntry[] {
  try {
    const items: unknown = JSON.parse(
      localStorage.getItem(LEGACY_ITEMS_KEY) ?? '[]',
    );
    const recipes: unknown = JSON.parse(
      localStorage.getItem(LEGACY_RECIPES_KEY) ?? '[]',
    );
    return [
      ...(Array.isArray(items) ? items : []).flatMap((id) =>
        typeof id === 'string' && id
          ? [{ kind: 'stack' as const, id }]
          : [],
      ),
      ...(Array.isArray(recipes) ? recipes : []).flatMap((row) =>
        row &&
        typeof row === 'object' &&
        typeof (row as RecipeFavorite).id === 'string' &&
        typeof (row as RecipeFavorite).type === 'string'
          ? [{ kind: 'recipe' as const, ...(row as RecipeFavorite) }]
          : [],
      ),
    ];
  } catch {
    return [];
  }
}

const codec: StoredCodec<FavoriteEntry[]> = {
  read: (raw) => {
    if (!raw) return legacyEntries();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is FavoriteEntry => {
      if (!entry || typeof entry !== 'object') return false;
      const row = entry as FavoriteEntry;
      if (row.kind === 'stack') return typeof row.id === 'string' && !!row.id;
      if (row.kind === 'recipe')
        return (
          typeof row.id === 'string' &&
          !!row.id &&
          typeof row.type === 'string' &&
          !!row.type
        );
      return false;
    });
  },
  write: (entries) => JSON.stringify(entries),
};

const useStoredFavorites = createStoredValue('wiki.recipe.favorites.v2', codec);

export function useFavorites() {
  const [entries, setEntries] = useStoredFavorites();

  const toggleItem = useCallback(
    (itemId: string, ref?: 'item' | 'fluid') => {
      setEntries((prev) =>
        prev.some(
          (entry) => entry.kind === 'stack' && entry.id === itemId,
        )
          ? prev.filter(
              (entry) => !(entry.kind === 'stack' && entry.id === itemId),
            )
          : [
              ...prev,
              {
                kind: 'stack',
                id: itemId,
                ...(ref && ref !== 'item' ? { ref } : {}),
              },
            ],
      );
    },
    [setEntries],
  );

  const isFavorite = useCallback(
    (itemId: string) =>
      entries.some((entry) => entry.kind === 'stack' && entry.id === itemId),
    [entries],
  );

  const toggleRecipe = useCallback(
    (row: RecipeFavorite) => {
      setEntries((prev) =>
        prev.some(
          (entry) =>
            entry.kind === 'recipe' &&
            entry.id === row.id &&
            entry.type === row.type,
        )
          ? prev.filter(
              (entry) =>
                !(
                  entry.kind === 'recipe' &&
                  entry.id === row.id &&
                  entry.type === row.type
                ),
            )
          : [...prev, { kind: 'recipe', ...row }],
      );
    },
    [setEntries],
  );

  const isRecipeFavorite = useCallback(
    (id: string) =>
      entries.some((entry) => entry.kind === 'recipe' && entry.id === id),
    [entries],
  );

  return {
    entries,
    toggleItem,
    isFavorite,
    toggleRecipe,
    isRecipeFavorite,
  };
}

