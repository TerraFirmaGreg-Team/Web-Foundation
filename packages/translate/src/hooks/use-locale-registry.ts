'use client';
import { createContext, useContext } from 'react';
import type { LocaleRegistry } from '@terrafirmagreg-team/translate/types/locale';

export const LocaleRegistryContext = createContext<LocaleRegistry | null>(null);

export function useLocaleRegistry(): LocaleRegistry {
  const registry = useContext(LocaleRegistryContext);
  if (!registry) throw new Error('Missing LocaleRegistryContext');
  return registry;
}

