'use client';
import { useEffect } from 'react';
import type { TreeFeatureProps } from '@terrafirmagreg-team/kit/types';
import { useGuideLeftSidebarTree } from '@terrafirmagreg-team/guide/hooks/use-left-sidebar-tree';

export function GuideTreeFeature({ input, dataset, onTree }: TreeFeatureProps) {
  const tree = useGuideLeftSidebarTree(input, dataset);
  useEffect(() => onTree({ input, tree }), [input, tree, onTree]);
  return null;
}
