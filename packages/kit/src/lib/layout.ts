import type { ComponentProps, ReactNode } from 'react';
import { uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import { NavTitle } from '@terrafirmagreg-team/kit/components/blocks/nav-title';

export interface BaseLayoutProps {
  nav?: { title?: string };
  slots?: { navTitle?: (props: ComponentProps<'a'>) => ReactNode };
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: uiConfig().brand?.name },
    slots: { navTitle: NavTitle },
  };
}

