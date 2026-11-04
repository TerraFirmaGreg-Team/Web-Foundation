import { FileQuestion } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
} from '@terrafirmagreg-team/ui/components/ui/empty';
import { Spinner } from '@terrafirmagreg-team/ui/components/ui/spinner';

export function EmptyState({
  variant = 'empty',
  children,
}: {
  variant?: 'empty' | 'missing' | 'loading';
  children?: ReactNode;
}) {
  return (
    <Empty className="gap-1 rounded-none border-none p-0 text-left">
      {variant === 'missing' ? (
        <EmptyMedia variant="icon" className="mb-0">
          <FileQuestion />
        </EmptyMedia>
      ) : variant === 'loading' ? (
        <EmptyMedia variant="icon" className="mb-0">
          <Spinner />
        </EmptyMedia>
      ) : null}
      <EmptyDescription className="text-left">{children}</EmptyDescription>
    </Empty>
  );
}

