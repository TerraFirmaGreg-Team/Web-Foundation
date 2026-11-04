'use client';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { isActive, safeURL } from '@terrafirmagreg-team/ui/lib/utils/urls';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import type { LinkItemType, LinkProps } from '@terrafirmagreg-team/ui/types/nav';

export function Link({
  ref,
  href = '#',
  external = !!(href.match(/^\w+:/) || href.startsWith('//')),
  prefetch,
  children,
  ...props
}: LinkProps) {
  const { Link: UiLink } = useUiComponents();
  if (external)
    return (
      <a ref={ref} href={href} rel="noreferrer noopener" target="_blank" {...props}>
        {children}
      </a>
    );
  return (
    <UiLink ref={ref} href={href} prefetch={prefetch} {...props}>
      {children}
    </UiLink>
  );
}

export default Link;

export function SafeLink({
  href,
  children,
  className,
  title,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const safe = safeURL(href);
  const node = safe ? (
    <Link href={safe} className={className}>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
  return <Hint label={title}>{node}</Hint>;
}

export function isLinkItemActive(
  link: LinkItemType,
  pathname: string,
): boolean {
  if (link.type === 'custom' || !link.url) return false;
  if (link.active === 'none') return false;
  return isActive(link.url, pathname, link.active === 'nested-url');
}

export function LinkItem({
  ref,
  item,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & {
  item: Extract<LinkItemType, { url: string }>;
}) {
  const pathname = usePathname();
  const active = isLinkItemActive(item, pathname);

  return (
    <Link
      ref={ref}
      href={item.url}
      external={item.external}
      {...props}
      data-active={active}
    >
      {props.children}
    </Link>
  );
}

