import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ComponentProps } from 'react';

export function Table(props: ComponentProps<'table'>) {
  return (
    <div className="relative overflow-auto prose-no-margin my-6" tabIndex={0}>
      <table
        {...props}
        className={cn('w-full', props.className)}
      />
    </div>
  );
}

