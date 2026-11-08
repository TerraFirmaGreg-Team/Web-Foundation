import { Check } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@terrafirmagreg-team/ui/components/ui/item';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

type ItemProps = ComponentProps<typeof Item>;

export function ItemRow({
  layout = 'list',
  href,
  target,
  rel,
  onClick,
  media,
  mediaClassName,
  title,
  titleClassName,
  description,
  overline,
  code,
  selected,
  trailing,
  size = 'xs',
  variant = 'default',
  align = 'center',
  className,
}: {
  layout?: 'list' | 'header';
  href?: string;
  target?: string;
  rel?: string;
  onClick?: () => void;
  media?: ReactNode;
  mediaClassName?: string;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  overline?: ReactNode;
  code?: ReactNode;
  selected?: boolean;
  trailing?: ReactNode;
  size?: ItemProps['size'];
  variant?: ItemProps['variant'];
  align?: 'center' | 'start';
  className?: string;
}) {
  if (layout === 'header') {
    return (
      <div className={cn('flex gap-3', align === 'center' ? 'items-center' : 'items-start', className)}>
        {media}
        <div className="min-w-0 flex-1">
          {overline ? <p className="text-xs text-muted-foreground">{overline}</p> : null}
          <div className={cn('text-sm font-medium', titleClassName)}>{title}</div>
          {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
          {code ? <code className="text-xs text-muted-foreground">{code}</code> : null}
        </div>
        {trailing}
      </div>
    );
  }
  return (
    <Item
      size={size}
      variant={variant}
      className={className}
      {...(href
        ? { render: <Link href={href} target={target} rel={rel} onClick={onClick} className="cursor-pointer hover:bg-accent hover:text-accent-foreground" /> }
        : { onClick, className: cn(className, onClick && 'cursor-pointer hover:bg-accent hover:text-accent-foreground') })}
    >
      {media ? <ItemMedia className={mediaClassName}>{media}</ItemMedia> : null}
      <ItemContent>
        <ItemTitle className={cn('truncate', titleClassName)}>{title}</ItemTitle>
        {description !== undefined ? <ItemDescription className="min-h-4 truncate">{description}</ItemDescription> : null}
      </ItemContent>
      {trailing || selected !== undefined ? (
        <ItemActions>
          {trailing}
          {selected !== undefined ? <Check className={cn('size-3.5 text-primary', !selected && 'invisible')} /> : null}
        </ItemActions>
      ) : null}
    </Item>
  );
}

