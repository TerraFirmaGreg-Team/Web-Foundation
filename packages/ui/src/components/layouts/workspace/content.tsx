'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ComponentProps } from 'react';

export function WorkspaceBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="workspace-body"
      {...props}
      className={cn('prose flex-1', className)}
    />
  );
}

export function WorkspaceDescription({
  children,
  className,
  ...props
}: ComponentProps<'p'>) {
  if (children === undefined) return null;
  return (
    <p
      data-slot="workspace-description"
      {...props}
      className={cn('mb-8 text-lg text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}

export function WorkspaceTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      data-slot="workspace-title"
      {...props}
      className={cn('text-[1.75em] font-semibold', className)}
    />
  );
}

export function WorkspaceFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="workspace-footer"
      className={cn('mt-auto empty:hidden', className)}
      {...props}
    />
  );
}
