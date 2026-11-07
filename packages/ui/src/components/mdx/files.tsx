'use client';

import { cva } from 'class-variance-authority';
import { FileIcon, FolderIcon, FolderOpen, SquareArrowOutUpRight } from 'lucide-react';
import Link from 'next/link';
import { type HTMLAttributes, type ReactNode, useState } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const itemVariants = cva(
  'flex flex-row items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground [&_svg]:size-4',
);

export function Files({ className, ...props }: HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div className={cn('not-prose rounded-md border bg-card p-2', className)} {...props}>
      {props.children}
    </div>
  );
}

export interface FileProps extends HTMLAttributes<HTMLDivElement> {
  name: ReactNode;
  icon?: ReactNode;
  href?: string;
  description?: string;
}

export interface FolderProps extends HTMLAttributes<HTMLDivElement> {
  name: ReactNode;

  disabled?: boolean;

  defaultOpen?: boolean;

  href?: string;

  description?: string;
}

export function File({
  name,
  icon = <FileIcon />,
  href,
  description,
  className,
  ...rest
}: FileProps): React.ReactElement {
  return (
    <div
      className={cn(itemVariants({ className }))}
      title={description}
      {...rest}
    >
      {icon}
      {href ? (
        <Link href={href} className="hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}
    </div>
  );
}

export function Folder({ name, defaultOpen = false, href, description, ...props }: FolderProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} {...props}>
      <div className="flex items-center" title={description}>
        <CollapsibleTrigger className={cn(itemVariants({ className: 'w-full' }))}>
          {open ? <FolderOpen /> : <FolderIcon />}
          {name}
        </CollapsibleTrigger>
        {href ? (
          <Link
            href={href}
            className="me-1 rounded p-1 text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
            aria-label={typeof name === 'string' ? name : undefined}
          >
            <SquareArrowOutUpRight />
          </Link>
        ) : null}
      </div>
      <CollapsibleContent>
        <div className="ms-2 flex flex-col border-l ps-2">{props.children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
