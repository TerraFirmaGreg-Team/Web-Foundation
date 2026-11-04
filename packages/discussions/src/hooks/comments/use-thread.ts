'use client';

import { usePathname } from 'next/navigation';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';

export function usePageThread(page?: string): string {
  const pathname = usePathname();
  const lang = useResolvedLang();
  return (page ?? `${pathname}~${lang}`).replaceAll(/[/#]/g, '~');
}

