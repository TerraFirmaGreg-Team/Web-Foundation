import katex from 'katex';
import { useMemo } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function Math({
  children,
  block = false,
  className,
}: {
  children?: string;
  block?: boolean;
  className?: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(children ?? '', {
        displayMode: block,
        throwOnError: false,
      }),
    [children, block],
  );
  const Tag = block ? 'div' : 'span';
  return (
    <Tag
      className={cn(block && 'my-4 overflow-x-auto text-center', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

