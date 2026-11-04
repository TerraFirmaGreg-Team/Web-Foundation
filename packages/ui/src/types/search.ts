import type { Dialog } from '@base-ui/react/dialog';
import type { Root } from 'hast';
import type { ReactNode } from 'react';

export interface SharedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogHandle: Dialog.Handle<unknown>;
}

export interface SortedResult<Content = string> {
  id: string;
  url: string;
  type: 'page' | 'heading' | 'text';
  content: Content;

  breadcrumbs?: Content[];

  table?: string;
}

export type ReactSortedResult = SortedResult<ReactNode>;

export interface SearchResultRecord extends SortedResult {

  hastContent: Root;
}

export interface SearchResultTable {
  type: 'table';

  id: string;
  columns: number;

  header?: Root;
  rows: SearchResultRecord[];
}

export type SearchResultItem = SearchResultRecord | SearchResultTable;

export interface SearchResult {

  query: string;
  items: SearchResultItem[];
}

export type SearchItemType =
  | ((ReactSortedResult | SearchResultRecord) & {
      external?: boolean;
    })
  | {
      id: string;
      type: 'action';
      node: ReactNode;
      onSelect: () => void;
    };

