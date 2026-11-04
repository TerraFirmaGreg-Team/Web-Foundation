import type { ReactNode } from 'react';

interface ID {

  $id?: string;
}

export interface Root extends ID {

  $ref?: Folder['$ref'];
  type?: 'root';
  name: ReactNode;
  description?: ReactNode;
  children: Node[];

  fallback?: Root;
}

export type Node = Item | Separator | Folder;

export interface Item extends ID {

  $ref?: string;
  type: 'page';
  name: ReactNode;
  url: string;

  external?: boolean;
  description?: ReactNode;
  icon?: ReactNode;
}

export interface Separator extends ID {
  type: 'separator';
  name?: ReactNode;
  icon?: ReactNode;
}

export interface Folder extends ID {

  $ref?: {
    meta?: string;
    folder: string;
  };
  type: 'folder';
  name: ReactNode;
  description?: ReactNode;

  root?: boolean | string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  index?: Item;
  icon?: ReactNode;
  children: Node[];
}

