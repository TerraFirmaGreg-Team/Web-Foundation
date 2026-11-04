'use client';
import {
  createContext,
  use,
  useEffect,
  type RefObject,
} from 'react';
import scrollIntoView from 'scroll-into-view-if-needed';

export interface SidebarContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  closeOnRedirect: RefObject<boolean>;
  defaultOpenLevel: number;
  prefetch?: boolean;
  mode: 'drawer' | 'full';
}

export interface FolderContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  depth: number;
  collapsible: boolean;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);
export const FolderContext = createContext<FolderContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = use(SidebarContext);
  if (!ctx)
    throw new Error(
      'Missing SidebarContext, make sure you have wrapped the component in <DocsLayout /> and the context is available.',
    );
  return ctx;
}

export function useFolder(): FolderContextValue | null {
  return use(FolderContext);
}

export function useFolderDepth(): number {
  return use(FolderContext)?.depth ?? 0;
}

export function useAutoScroll(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
): void {
  const { mode } = useSidebar();
  useEffect(() => {
    if (active && ref.current)
      scrollIntoView(ref.current, {
        boundary: document.getElementById(
          mode === 'drawer' ? 'sidebar-mobile' : 'sidebar',
        ),
        scrollMode: 'if-needed',
      });
  }, [active, mode, ref]);
}

