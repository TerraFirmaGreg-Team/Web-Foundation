import {
  Bell,
  Bug,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Info,
  Lightbulb,
  ListChecks,
  Megaphone,
  OctagonAlert,
  OctagonX,
  Quote,
  StickyNote,
  TriangleAlert,
} from 'lucide-react';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { calloutStyle } from '@terrafirmagreg-team/ui/lib/mdx/callout';

export type CalloutType =
  | 'note'
  | 'tip'
  | 'info'
  | 'important'
  | 'warn'
  | 'warning'
  | 'caution'
  | 'attention'
  | 'danger'
  | 'error'
  | 'success'
  | 'idea'
  | 'question'
  | 'failure'
  | 'bug'
  | 'abstract'
  | 'example'
  | 'quote';

const iconClass = 'size-5 -me-0.5 fill-(--callout-color) text-card';
const textIconClass =
  'size-5 -me-0.5 fill-(--callout-color) text-(--callout-color)';

const ICONS: Record<string, ReactNode> = {
  note: <StickyNote className={iconClass} />,
  tip: <Lightbulb className={textIconClass} />,
  info: <Info className={iconClass} />,
  important: <Megaphone className={iconClass} />,
  warn: <TriangleAlert className={iconClass} />,
  warning: <TriangleAlert className={iconClass} />,
  caution: <OctagonAlert className={iconClass} />,
  attention: <Bell className={iconClass} />,
  danger: <OctagonX className={iconClass} />,
  error: <CircleAlert className={iconClass} />,
  success: <CircleCheck className={iconClass} />,
  idea: <Lightbulb className={textIconClass} />,
  question: <CircleHelp className={iconClass} />,
  failure: <CircleX className={iconClass} />,
  bug: <Bug className={iconClass} />,
  abstract: <ClipboardList className={iconClass} />,
  example: <ListChecks className={iconClass} />,
  quote: <Quote className={iconClass} />,
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

