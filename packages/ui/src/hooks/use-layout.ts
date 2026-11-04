'use client';
import {
  createContext,
  use,
  type ComponentProps,
  type ComponentType,
} from 'react';

export const LayoutContext = createContext<{
  navTitle: ComponentType<ComponentProps<'a'>>;
} | null>(null);

export function useLayout() {
  const context = use(LayoutContext);
  if (!context)
    throw new Error('Missing LayoutContext, expected under <Layout />.');
  return context;
}

