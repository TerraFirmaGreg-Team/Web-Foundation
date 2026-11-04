import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import type { ReactNode } from 'react';

export interface TreeContextValue {

  root: PageTree.Root | PageTree.Folder;
  full: PageTree.Root;
}

export interface TabOption {
  url: string;
  title?: ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  unlisted?: boolean;
  $folder?: PageTree.Folder;
  urls?: Set<string>;
}

