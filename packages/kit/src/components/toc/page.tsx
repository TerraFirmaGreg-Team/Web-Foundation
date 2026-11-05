'use client';
import type { ReactNode } from 'react';
import { TOCProvider } from '@terrafirmagreg-team/kit/components/toc/base';
import type { TOCItemType } from 'fumadocs-core/toc';

export function PageToc({
  toc = [],
  single,
  popover,
  outline,
  children,
}: {
  toc?: TOCItemType[];
  single?: boolean;
  popover?: ReactNode;
  outline?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <TOCProvider single={single} toc={toc}>
      <div
        data-slot="workspace-outline-popover"
        className="sticky top-[calc(var(--banner-height,0px)+var(--header-height))] z-30 [grid-area:toc-popover] self-start md:hidden"
      >
        {popover}
        <div className="absolute inset-x-2 top-full h-[calc(var(--layout-height)_-_var(--header-height)_-_100%)] rounded-t-2xl border-x border-t outline-8 outline-card [clip-path:inset(0_-8px_-8px)] bg-origin-border bg-linear-to-b from-background to-transparent to-[16px] pointer-events-none" />
      </div>
      {children}
      {outline}
    </TOCProvider>
  );
}
