'use client';
import type { TOCItemType } from 'fumadocs-core/toc';
import { createContext, use } from 'react';

export const TOCContext = createContext<TOCItemType[]>([]);

export function useTOCItems(): TOCItemType[] {
  return use(TOCContext);
}

