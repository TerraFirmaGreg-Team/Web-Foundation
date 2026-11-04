'use client';
import type { ComponentProps, ReactNode } from 'react';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export type SiteTitleProps = {
  icon: string;
  name: ReactNode;
  subtitle?: ReactNode;
  href?: string;
} & Omit<ComponentProps<'a'>, 'href'>;

export function SiteTitle({
  icon,
  name,
  subtitle,
  href,
  className,
  ...props
}: SiteTitleProps) {
  const { Link } = useUiComponents();
  const cls = cn(
    'inline-flex min-w-0 items-center gap-2.5 text-nav-title font-medium',
    className,
  );
  const sub = subtitle ? (
    <span
      className="truncate text-2xs font-normal text-muted-foreground"
      suppressHydrationWarning
    >
      {subtitle}
    </span>
  ) : null;
  if (!href) {
    return (
      <span className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element -- site icon */}
        <img src={icon} alt="" className="size-5 shrink-0" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate">{name}</span>
          {sub}
        </span>
      </span>
    );
  }
  return (
    <span className={cls}>
      <Link href={href} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- site icon */}
        <img src={icon} alt="" className="size-5 shrink-0" />
      </Link>
      <span className="flex min-w-0 flex-col leading-tight">
        <Link href={href} className="truncate" {...props}>
          {name}
        </Link>
        {sub}
      </span>
    </span>
  );
}

