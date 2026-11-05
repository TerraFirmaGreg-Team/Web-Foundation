'use client';
import {
  AnchorProvider,
  ScrollProvider,
  type AnchorProviderProps,
} from 'fumadocs-core/toc';
import { useMemo, useRef, type ComponentProps } from 'react';
import { TOCContext } from '@terrafirmagreg-team/kit/hooks/use-toc';
import { tocTitle } from '@terrafirmagreg-team/kit/lib/toc-title';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { mergeRefs } from '@terrafirmagreg-team/ui/lib/utils/merge-refs';

export {
  AnchorProvider,
  ScrollProvider,
  TOCItem,
  useActiveAnchor,
  useActiveAnchors,
  useItems,
  useTOC,
  useTOCListener,
  useTOCSelector,
} from 'fumadocs-core/toc';
export type {
  AnchorProviderProps,
  ScrollProviderProps,
  TOCItemInfo,
  TOCItemProps,
  TOCItemType,
  TableOfContents,
} from 'fumadocs-core/toc';

export type TOCProviderProps = AnchorProviderProps;

export function TOCProvider({ toc, children, ...props }: TOCProviderProps) {
  const items = useMemo(
    () => toc?.map((item) => ({ ...item, title: tocTitle(item) })),
    [toc],
  );
  return (
    <TOCContext value={items}>
      <AnchorProvider toc={items} {...props}>
        {children}
      </AnchorProvider>
    </TOCContext>
  );
}

export function TOCScrollArea({
  ref,
  className,
  ...props
}: ComponentProps<'div'>) {
  const viewRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={mergeRefs(viewRef, ref)}
      className={cn(
        'relative min-h-0 text-sm overflow-x-clip overflow-y-auto overscroll-contain [scrollbar-width:none] mask-[linear-gradient(to_bottom,transparent,white_16px,white_calc(100%-16px),transparent)] py-3',
        className,
      )}
      {...props}
    >
      <ScrollProvider containerRef={viewRef}>
        {props.children}
      </ScrollProvider>
    </div>
  );
}

