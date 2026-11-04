'use client';

import type { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/context-menu';

export function CopyMenu({
  items,
  extra,
  children,
}: {
  items: { label: ReactNode; value: string; icon?: ReactNode }[];
  extra?: ReactNode;
  children: ReactNode;
}) {
  const copy = (value: string) => () => {
    void navigator.clipboard.writeText(value);
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger className="contents">{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {items.map((item, index) => (
          <ContextMenuItem key={index} onClick={copy(item.value)}>
            {item.icon}
            {item.label}
          </ContextMenuItem>
        ))}
        {extra}
      </ContextMenuContent>
    </ContextMenu>
  );
}
