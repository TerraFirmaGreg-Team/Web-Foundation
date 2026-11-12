'use client';
import { usePathname } from 'next/navigation';
import {
  use,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react';
import ReactDOM from 'react-dom';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useHotKey } from '@terrafirmagreg-team/ui/hooks/use-hot-key';
import { useMediaQuery } from '@terrafirmagreg-team/ui/hooks/use-media-query';
import { useOnChange } from '@terrafirmagreg-team/ui/hooks/use-on-change';
import {
  FolderContext,
  SidebarContext,
  useAutoScroll,
  useFolderDepth,
  useSidebar,
} from '@terrafirmagreg-team/ui/hooks/use-sidebar';
import { Link } from '@terrafirmagreg-team/ui/components/blocks/nav/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@terrafirmagreg-team/ui/components/ui/collapsible';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export type { SidebarContextValue } from '@terrafirmagreg-team/ui/hooks/use-sidebar';

export function SidebarProvider({
  defaultOpenLevel = 0,
  prefetch,
  collapsible = true,
  children,
}: {
  defaultOpenLevel?: number;
  prefetch?: boolean;
  collapsible?: boolean;
  children: ReactNode;
}) {
  const closeOnRedirect = useRef(true);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const mode = useMediaQuery('(width < 768px)') ? 'drawer' : 'full';

  useOnChange(pathname, () => {
    if (closeOnRedirect.current) setOpen(false);
    closeOnRedirect.current = true;
  });

  useHotKey(
    (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.key !== 'b')
        return;
      e.preventDefault();
      setCollapsed((prev) => !prev);
    },
    { enabled: collapsible && mode === 'full', ignoreTyping: true },
  );

  return (
    <SidebarContext
      value={useMemo(
        () => ({
          open,
          setOpen,
          collapsed,
          setCollapsed,
          closeOnRedirect,
          defaultOpenLevel,
          prefetch,
          mode,
        }),
        [open, collapsed, defaultOpenLevel, prefetch, mode],
      )}
    >
      {children}
    </SidebarContext>
  );
}

export function SidebarContent({
  children,
}: {
  children: (props: {
    ref: RefObject<HTMLElement | null>;
    collapsed: boolean;
    hovered: boolean;
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
  }) => ReactNode;
}) {
  const { collapsed, mode } = useSidebar();
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const timerRef = useRef(0);

  useOnChange(collapsed, () => {
    if (collapsed) setHover(false);
  });

  if (mode !== 'full') return null;

  function shouldIgnoreHover(e: React.PointerEvent<HTMLElement>) {
    const element = ref.current;
    if (!element) return true;
    return (
      !collapsed || e.pointerType === 'touch' || element.getAnimations().length > 0
    );
  }

  // eslint-disable-next-line react-hooks/refs -- render-prop contract: the ref object is handed to the caller, never read here
  return children({
    ref,
    collapsed,
    hovered: hover,
    onPointerEnter(e) {
      if (shouldIgnoreHover(e)) return;
      window.clearTimeout(timerRef.current);
      setHover(true);
    },
    onPointerLeave(e) {
      if (shouldIgnoreHover(e)) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(
        () => setHover(false),
        Math.min(e.clientX, document.body.clientWidth - e.clientX) > 100
          ? 0
          : 500,
      );
    },
  });
}

export function SidebarDrawerOverlay(props: ComponentProps<'div'>) {
  const { open, setOpen, mode } = useSidebar();
  const [hidden, setHidden] = useState(!open);

  if (open && hidden) setHidden(false);
  if (mode !== 'drawer' || hidden) return null;

  return (
    <div
      data-state={open ? 'open' : 'closed'}
      onClick={() => setOpen(false)}
      onAnimationEnd={() => {
        if (!open) ReactDOM.flushSync(() => setHidden(true));
      }}
      {...props}
    />
  );
}

export function SidebarDrawerContent({
  className,
  children,
  ...props
}: ComponentProps<'aside'>) {
  const { open, mode } = useSidebar();
  const [hidden, setHidden] = useState(!open);

  if (open && hidden) setHidden(false);
  if (mode !== 'drawer') return null;

  return (
    <aside
      id="sidebar-mobile"
      data-state={open ? 'open' : 'closed'}
      className={cn(hidden && 'invisible', className)}
      onAnimationEnd={() => {
        if (!open) ReactDOM.flushSync(() => setHidden(true));
      }}
      {...props}
    >
      {children}
    </aside>
  );
}

export function SidebarViewport({
  className,
  ...props
}: ComponentProps<typeof ScrollArea.Root>) {
  return (
    <ScrollArea.Root
      className={(s) =>
        cn('min-h-0 flex-1', typeof className === 'function' ? className(s) : className)
      }
      {...props}
    >
      <ScrollArea.Viewport className="size-full rounded-[inherit] p-4 overscroll-contain mask-[linear-gradient(to_bottom,transparent,white_12px,white_calc(100%-12px),transparent)]">
        {props.children}
      </ScrollArea.Viewport>
      <ScrollArea.Corner />
      <ScrollArea.Scrollbar
        className={(s) =>
          cn(
            'flex h-full w-1.5 select-none transition-opacity',
            !s.hovering && 'opacity-0',
          )
        }
      >
        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

export function SidebarSeparator(props: ComponentProps<'p'>) {
  const depth = useFolderDepth();
  return (
    <p
      {...props}
      className={cn(
        'inline-flex items-center gap-2 mb-1.5 px-2 mt-6 empty:mb-0',
        depth === 0 && 'first:mt-0',
        props.className,
      )}
    >
      {props.children}
    </p>
  );
}

export function SidebarItem({
  icon,
  active = false,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  icon?: ReactNode;
  active?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { prefetch } = useSidebar();
  useAutoScroll(active, ref);

  return (
    <Link ref={ref} data-active={active} prefetch={prefetch} {...props}>
      {icon ?? (props.external ? <ExternalLink /> : null)}
      {children}
    </Link>
  );
}

export function SidebarFolder({
  defaultOpen: defaultOpenProp,
  collapsible = true,
  active = false,
  children,
  ...props
}: ComponentProps<'div'> & {
  defaultOpen?: boolean;
  collapsible?: boolean;
  active?: boolean;
}) {
  const { defaultOpenLevel } = useSidebar();
  const depth = useFolderDepth() + 1;
  const defaultOpen =
    collapsible === false || active || (defaultOpenProp ?? defaultOpenLevel >= depth);
  const [open, setOpen] = useState(defaultOpen);

  useOnChange(defaultOpen, (v) => {
    if (v) setOpen(v);
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen} disabled={!collapsible} {...props}>
      <FolderContext
        value={useMemo(
          () => ({ open, setOpen, depth, collapsible }),
          [collapsible, depth, open],
        )}
      >
        {children}
      </FolderContext>
    </Collapsible>
  );
}

export function SidebarFolderTrigger({
  children,
  ...props
}: ComponentProps<'button'>) {
  const folder = use(FolderContext);
  if (folder?.collapsible)
    return (
      <CollapsibleTrigger {...props}>
        {children}
        <ChevronDown
          data-icon
          className={cn(
            'ms-auto transition-transform',
            !folder.open && '-rotate-90 rtl:rotate-90',
          )}
        />
      </CollapsibleTrigger>
    );
  return <div {...(props as ComponentProps<'div'>)}>{children}</div>;
}

export function SidebarFolderLink({
  children,
  active = false,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { active?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const folder = use(FolderContext);
  const { prefetch } = useSidebar();
  useAutoScroll(active, ref);

  return (
    <Link
      ref={ref}
      data-active={active}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !folder?.collapsible) return;
        if (
          e.target instanceof Element &&
          e.target.matches('[data-icon], [data-icon] *')
        ) {
          folder.setOpen(!folder.open);
          e.preventDefault();
        } else folder.setOpen(active ? !folder.open : true);
      }}
      prefetch={prefetch}
      {...props}
    >
      {children}
      {folder?.collapsible && (
        <ChevronDown
          data-icon
          className={cn(
            'ms-auto transition-transform',
            !folder.open && '-rotate-90 rtl:rotate-90',
          )}
        />
      )}
    </Link>
  );
}

export function SidebarFolderContent(props: ComponentProps<'div'>) {
  return <CollapsibleContent {...props}>{props.children}</CollapsibleContent>;
}

export function SidebarTrigger({
  children,
  ...props
}: ComponentProps<'button'>) {
  const { open, setOpen } = useSidebar();
  const t = useTranslations();

  return (
    <button
      type="button"
      aria-label={
        open
          ? t('Close Sidebar', { note: 'ui.sidebar_close' })
          : t('Open Sidebar', { note: 'ui.sidebar_open' })
      }
      aria-expanded={open}
      aria-controls="sidebar-mobile"
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SidebarCollapseTrigger(props: ComponentProps<'button'>) {
  const { collapsed, setCollapsed } = useSidebar();
  const t = useTranslations();

  return (
    <button
      type="button"
      aria-label={t('Collapse Sidebar', { note: 'ui.sidebar_collapse' })}
      aria-controls="sidebar"
      aria-expanded={!collapsed}
      data-collapsed={collapsed}
      onClick={(e) => {
        const button = e.currentTarget;
        ReactDOM.flushSync(() => setCollapsed((prev) => !prev));
        if (button.matches('[inert] *'))
          document
            .querySelector<HTMLElement>(
              '[aria-controls="sidebar"]:not([inert] *)',
            )
            ?.focus();
      }}
      {...props}
    >
      {props.children}
    </button>
  );
}

