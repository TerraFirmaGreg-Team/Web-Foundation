'use client';
import { Dialog } from '@base-ui/react/dialog';
import { createContext, use } from 'react';

export const dialogHandle = Dialog.createHandle();

export interface SearchContextType {
  enabled: boolean;
  open: boolean;
  hotKey: { display: React.ReactNode; key: string | ((e: KeyboardEvent) => boolean) }[];
  setOpenSearch: (value: boolean) => void;
  dialogHandle: Dialog.Handle<unknown>;
}

export const SearchContext = createContext<SearchContextType>({
  enabled: false,
  open: false,
  hotKey: [],
  setOpenSearch: () => undefined,
  dialogHandle,
});

export function useSearchContext(): SearchContextType {
  return use(SearchContext);
}

