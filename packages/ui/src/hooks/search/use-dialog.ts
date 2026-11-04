'use client';
import { createContext, use } from 'react';
import type {
  SearchItemType,
  SearchResult,
} from '@terrafirmagreg-team/ui/types/search';

export const SearchDialogContext = createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (item: SearchItemType) => void;
  isLoading: boolean;
  data?: SearchResult;
  error?: Error;

  query: string;

  getActive: () => string | null;
  setActive: (id: string | null) => void;
  subscribeActive: (listener: () => void) => () => void;
} | null>(null);

export const SearchTagsListContext = createContext<{
  value?: string;
  onValueChange: (value: string | undefined) => void;
  allowClear: boolean;
} | null>(null);

export function useSearch() {
  const ctx = use(SearchDialogContext);
  if (!ctx) throw new Error('Missing <SearchDialog />');
  return ctx;
}

export function useSearchTagsList() {
  const ctx = use(SearchTagsListContext);
  if (!ctx) throw new Error('Missing <SearchTagsList />');
  return ctx;
}

