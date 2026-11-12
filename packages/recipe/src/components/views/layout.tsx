'use client';
import { useEffect } from 'react';
import type { TreeFeatureProps } from '@terrafirmagreg-team/kit/types';
import { useRecipeLeftSidebarTree } from '@terrafirmagreg-team/recipe/hooks/use-left-sidebar-tree';

export function RecipeTreeFeature({ input, dataset, onTree }: TreeFeatureProps) {
  const tree = useRecipeLeftSidebarTree(input, dataset);
  useEffect(() => onTree({ input, tree }), [input, tree, onTree]);
  return null;
}
