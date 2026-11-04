'use client';
import type { ReactNode } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@terrafirmagreg-team/ui/components/ui/command';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export type CommandSearchItem<T = unknown> = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  data?: T;
};

export function CommandSearch<T = unknown>({
  open,
  onClose,
  query,
  onQuery,
  title,
  placeholder,
  emptyLabel,
  items,
  onPick,
  className,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  onQuery: (value: string) => void;
  title: string;
  placeholder?: string;
  emptyLabel: ReactNode;
  items: CommandSearchItem<T>[];
  onPick: (item: CommandSearchItem<T>) => void;
  className?: string;
}) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description={placeholder ?? title}
      className={cn('max-w-lg', className)}
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput value={query} onValueChange={onQuery} placeholder={placeholder} />
      {query.trim() ? (
        <CommandList className="max-h-80">
          {items.length === 0 ? (
            <CommandEmpty>{emptyLabel}</CommandEmpty>
          ) : (
            items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => {
                  onPick(item);
                  onClose();
                }}
              >
                {item.icon}
                <span className="min-w-0 truncate">{item.label}</span>
                {item.meta && <span className="ml-auto text-xs text-muted-foreground">{item.meta}</span>}
              </CommandItem>
            ))
          )}
        </CommandList>
      ) : null}
    </CommandDialog>
  );
}

