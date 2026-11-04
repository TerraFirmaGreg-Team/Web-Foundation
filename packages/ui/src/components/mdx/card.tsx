'use client';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import type { ComponentProps, ComponentType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Icon } from '@terrafirmagreg-team/ui/components/mdx/icon';

export function Cards(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn('grid grid-cols-2 gap-3 @container', props.className)}>
      {props.children}
    </div>
  );
}

export type CardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  icon?: ReactNode | string;
  title: ReactNode;
  description?: ReactNode;

  href?: string;
  external?: boolean;
};

export function Card({ icon, title, description, ...props }: CardProps) {
  const { Link } = useUiComponents();
  const { external, href, ...rest } = props;
  const E = (href ? Link : 'div') as ComponentType<ComponentProps<'a'>>;

  return (
    <E
      {...rest}
      href={href}
      {...(external
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      data-card
      className={cn(
        'block rounded-xl border bg-card p-4 text-card-foreground transition-colors @max-lg:col-span-full',
        props.href && 'hover:bg-accent/80',
        props.className,
      )}
    >
      {icon ? (
        <div className="not-prose mb-2 inline-flex h-7 min-w-8 items-center justify-center rounded-lg border bg-muted px-2 text-muted-foreground shadow-md [&_svg]:size-4">
          {typeof icon === 'string' ? <Icon name={icon} /> : icon}
        </div>
      ) : null}
      <h3 className="not-prose mb-1 text-sm font-medium">{title}</h3>
      {description ? <p className="my-0! text-sm text-muted-foreground">{description}</p> : null}
      <div className="text-sm text-muted-foreground prose-no-margin empty:hidden">
        {props.children}
      </div>
    </E>
  );
}

