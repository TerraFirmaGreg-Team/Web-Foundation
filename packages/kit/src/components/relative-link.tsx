import type { LoaderConfig, LoaderOutput, Page } from 'fumadocs-core/source';
import type { ComponentProps, ReactNode } from 'react';
import Link from 'fumadocs-core/link';

export function createRelativeLink<C extends LoaderConfig>(
  source: LoaderOutput<C>,
  page: Page | C['page'],
  OverrideLink: (props: ComponentProps<'a'>) => ReactNode = Link,
): (props: ComponentProps<'a'>) => ReactNode | Promise<ReactNode> {
  return async function RelativeLink({ href, ...props }) {
    return (
      <OverrideLink
        href={href ? source.resolveHref(href, page) : href}
        {...props}
      />
    );
  };
}

