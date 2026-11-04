'use client';

import { useEffect } from 'react';
import { useFavorites } from '@terrafirmagreg-team/recipe/hooks/use-favorites';
import { favoriteHoverTarget } from '@terrafirmagreg-team/recipe/lib/favorite-hover';

export function useFavoriteHotkey() {
  const { toggleItem, toggleRecipe } = useFavorites();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key !== 'a' && key !== 'ф') return;
      const el = document.activeElement;
      if (
        el instanceof HTMLElement &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      ) {
        return;
      }
      const target = favoriteHoverTarget();
      if (!target) return;
      event.preventDefault();
      if (target.kind === 'recipe') {
        toggleRecipe({
          id: target.id,
          type: target.type,
          ...(target.icon ? { icon: target.icon } : {}),
        });
      } else {
        toggleItem(target.id, target.ref);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleItem, toggleRecipe]);
}

