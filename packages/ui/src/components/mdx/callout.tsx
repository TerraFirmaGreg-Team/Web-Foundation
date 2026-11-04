import { CircleCheck, CircleX, Info, Lightbulb, StickyNote, TriangleAlert } from 'lucide-react';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { calloutStyle } from '@terrafirmagreg-team/ui/lib/mdx/callout';

export type CalloutType =
  | 'info'
  | 'note'
  | 'tip'
  | 'warn'
  | 'warning'
  | 'error'
  | 'danger'
  | 'success'
  | 'idea';

const iconClass = 'size-5 -me-0.5 fill-(--callout-color) text-card';

const ICONS: Record<string, ReactNode> = {
  info: <Info className={iconClass} />,
  note: <StickyNote className={iconClass} />,
  tip: (
    <Lightbulb className="size-5 -me-0.5 fill-(--callout-color) text-(--callout-color)" />
  ),
  warn: <TriangleAlert className={iconClass} />,
  warning: <TriangleAlert className={iconClass} />,
  error: <CircleX className={iconClass} />,
  danger: <CircleX className={iconClass} />,
  success: <CircleCheck className={iconClass} />,
  idea: (
    <Lightbulb className="size-5 -me-0.5 fill-(--callout-color) text-(--callout-color)" />
  ),
};

export function Callout({
  children,
  title,
  ...props
}: { title?: ReactNode } & Omit<CalloutContainerProps, 'title'>) {
  return (
    <CalloutContainer {...props}>
      {title && <CalloutTitle>{title}</CalloutTitle>}
      <CalloutDescription>{children}</CalloutDescription>
    </CalloutContainer>
  );
}

export interface CalloutContainerProps extends ComponentProps<'div'> {

  type?: CalloutType;

  icon?: ReactNode;
}

export function CalloutContainer({
  type = 'info',
  icon,
  children,
  className,
  style,
  ...props
}: CalloutContainerProps) {
  return (
    <div
      className={cn(
        'flex gap-2 my-4 rounded-xl border bg-card p-3 ps-1 text-sm text-card-foreground',
        className,
      )}
      style={calloutStyle(type, style)}
      {...props}
    >
      <div role="none" className="w-0.5 bg-(--callout-color)/50 rounded-sm" />
      {icon ?? ICONS[type]}
      <div className="flex flex-col gap-2 min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function CalloutTitle({ children, className, ...props }: ComponentProps<'p'>) {
  return (
    <p className={cn('font-medium my-0!', className)} {...props}>
      {children}
    </p>
  );
}

export function CalloutDescription({ children, className, ...props }: ComponentProps<'p'>) {
  return (
    <div
      className={cn('text-muted-foreground prose-no-margin empty:hidden', className)}
      {...props}
    >
      {children}
    </div>
  );
}

