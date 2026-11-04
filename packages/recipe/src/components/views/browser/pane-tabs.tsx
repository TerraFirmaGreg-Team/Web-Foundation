'use client';

import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@terrafirmagreg-team/ui/components/ui/tabs';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export type PaneTabOption<T extends string> = {
  id: T;
  label: string;
  icon: ReactNode;
  help?: string;
  disabled?: boolean;
};

export function PaneTabs<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: PaneTabOption<T>[];
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(id) => onChange(id as T)}
      className={cn('flex', className)}
    >
      <TabsList className="flex-wrap gap-1 bg-transparent p-0">
        {options.map((option) => (
          <Tooltip key={option.id}>
            <TooltipTrigger
              render={
                <TabsTrigger
                  value={option.id}
                  disabled={option.disabled}
                  className="h-7 flex-none rounded-lg border border-border bg-background px-2.5 text-xs hover:bg-muted hover:text-foreground data-active:border-border data-active:bg-secondary data-active:text-secondary-foreground"
                />
              }
            >
              {option.icon}
              {option.label}
            </TooltipTrigger>
            {option.help ? (
              <TooltipContent>{option.help}</TooltipContent>
            ) : null}
          </Tooltip>
        ))}
      </TabsList>
    </Tabs>
  );
}

