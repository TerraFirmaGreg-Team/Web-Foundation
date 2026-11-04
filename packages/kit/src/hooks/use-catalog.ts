'use client';
import { createContext, useContext } from 'react';
import type { DatasetCatalog } from '@terrafirmagreg-team/kit/types';

export const SectionCatalogContext = createContext<DatasetCatalog | null>(null);

export function useSectionCatalog(): DatasetCatalog {
  const catalog = useContext(SectionCatalogContext);
  if (!catalog) throw new Error('SectionCatalogContext is not provided');
  return catalog;
}

