'use client';
import {
  createContext,
  use,
  useMemo,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { PopoverContent } from '@terrafirmagreg-team/ui/components/ui/popover';
import type { NavItemMatch } from '@terrafirmagreg-team/ui/lib/utils/nav-active';

export type SettingsMenuComponent = ComponentType<{
  anchor?: ComponentProps<typeof PopoverContent>['anchor'];
}>;

export type LeftSidebarParts = {
  controls?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;

  menu?: ReactNode;
  match?: NavItemMatch;
  navKeys?: ReadonlySet<string>;
  settings?: SettingsMenuComponent;
};

const LeftSidebarPortalContext = createContext<{
  target: HTMLElement | null;
  setTarget: (el: HTMLElement | null) => void;
} | null>(null);

export function LeftSidebarPortalProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  return (
    <LeftSidebarPortalContext
      value={useMemo(() => ({ target, setTarget }), [target])}
    >
      {children}
    </LeftSidebarPortalContext>
  );
}

export function LeftSidebarPortal({ children }: { children?: ReactNode }) {
  const ctx = use(LeftSidebarPortalContext);
  return ctx?.target ? createPortal(children, ctx.target) : null;
}

export function LeftSidebarPortalTarget() {
  const ctx = use(LeftSidebarPortalContext);
  return <div data-slot="left-sidebar-portal" ref={ctx?.setTarget} />;
}

