'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

const RightSidebarContext = createContext<HTMLElement | null>(null);

export function RightSidebar({ children, className, ...props }: ComponentProps<'div'>) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      let node = event.target as HTMLElement | null;
      while (node && node !== el) {
        const style = getComputedStyle(node);
        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
          const canScroll = event.deltaY > 0
            ? node.scrollTop + node.clientHeight < node.scrollHeight - 1
            : node.scrollTop > 0;
          if (canScroll) return;
        }
        node = node.parentElement;
      }
      const page = document.getElementById('page')?.parentElement;
      if (!page || page.scrollHeight <= page.clientHeight) return;
      event.preventDefault();
      page.scrollBy({ top: event.deltaY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [el]);
  return (
    <RightSidebarContext.Provider value={el}>
      {children}
      <div
        ref={setEl}
        data-slot="right-sidebar"
        className={cn('flex min-h-0 flex-col gap-2 lg:my-2 lg:w-96 lg:px-3 [grid-area:right] [grid-row:main]', className)}
        {...props}
      />
    </RightSidebarContext.Provider>
  );
}

export function RightSidebarPortal({ children }: ComponentProps<'div'>) {
  const el = useContext(RightSidebarContext);
  return el ? createPortal(children, el) : null;
}

export function RightSidebarPanel({
  header,
  footer,
  children,
  className,
  ...props
}: ComponentProps<'div'> & { header?: ReactNode; footer?: ReactNode }) {
  return (
    <div
      data-slot="panel"
      className={cn('hidden h-full min-h-0 w-90 min-w-0 flex-col lg:flex', className)}
      {...props}
    >
      {header}
      {children}
      {footer}
    </div>
  );
}

export function RightSidebarPanelHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-header"
      className={cn('flex shrink-0 items-center gap-1.5', className)}
      {...props}
    />
  );
}

export function RightSidebarPanelBody({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="panel-body"
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      {...props}
    />
  );
}

