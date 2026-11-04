'use client';

import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/dropdown-menu';

export type SiteMenuItem = {
  label: string;
  icon?: ReactNode;
} & ({ url: string; external?: boolean } | { onClick: () => void });

export function SiteMenu({
  label,
  items,
}: {
  label?: string;
  items: readonly (SiteMenuItem | 'separator' | null | undefined | false)[];
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={label}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'size-8 text-muted-foreground',
        )}
      >
        <Menu />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="min-w-44">
        {items.map((item, i) => {
          if (item === 'separator') return <DropdownMenuSeparator key={i} />;
          if (!item) return null;
          const inner = (
            <>
              {item.icon != null && (
                <span aria-hidden="true" className="contents [&_svg]:size-4">
                  {item.icon}
                </span>
              )}
              {item.label}
            </>
          );
          return 'onClick' in item ? (
            <DropdownMenuItem key={i} closeOnClick className="gap-2" onClick={item.onClick}>
              {inner}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              key={i}
              closeOnClick
              className="gap-2"
              render={
                <a
                  href={item.url}
                  {...(item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                />
              }
            >
              {inner}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

