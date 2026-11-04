'use client';

import { ChevronRight, CircleAlert, Hash, SearchIcon } from 'lucide-react';
import {
  type ComponentProps,
  Fragment,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { T } from '@terrafirmagreg-team/translate';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Dialog } from '@base-ui/react/dialog';
import { useHighlightQuery } from '@terrafirmagreg-team/ui/hooks/search/use-highlight-query';
import {
  SearchDialogContext,
  SearchTagsListContext,
  useSearch,
  useSearchTagsList,
} from '@terrafirmagreg-team/ui/hooks/search/use-dialog';
import type {
  ReactSortedResult,
  SearchItemType,
  SearchResult,
  SearchResultItem,
  SearchResultRecord,
  SearchResultTable,
  SharedProps,
} from '@terrafirmagreg-team/ui/types/search';
import { type Options, toJsxRuntime } from 'hast-util-to-jsx-runtime';
import * as JsxRuntime from 'react/jsx-runtime';
import { cva } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import scrollIntoView from 'scroll-into-view-if-needed';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { mergeRefs } from '@terrafirmagreg-team/ui/lib/utils/merge-refs';

type ItemRenderer = (props: {
  item: SearchItemType;
  table?: SearchResultTable;
  onClick: () => void;
}) => ReactNode;

interface TableProps {
  table: SearchResultTable;
  Item: ItemRenderer;
  onSelect: (item: SearchItemType) => void;
}

export type { SearchItemType, SharedProps } from '@terrafirmagreg-team/ui/types/search';

export interface SearchDialogProps extends SharedProps {
  search: string;
  onSearchChange: (v: string) => void;
  onSelect?: (item: SearchItemType) => void;
  isLoading?: boolean;

  data?: SearchResult;

  error?: Error;

  children: ReactNode;
}

const mdComponents = {

  mark(props: ComponentProps<'mark'>) {
    return <span {...props} className="text-primary underline" />;
  },
  a: 'span',
  p(props: ComponentProps<'p'>) {
    return <p {...props} className="min-w-0" />;
  },
  custom({
    tagName,
    children,
    ...rest
  }: Record<string, unknown> & { tagName: string; children?: ReactNode }) {
    return (
      <span className="inline-flex max-w-full items-center border p-0.5 rounded-md bg-card text-card-foreground divide-x divide-border">
        <code
          data-highlight-ignore=""
          className="not-prose rounded-sm px-0.5 me-1 bg-primary font-medium text-xs text-primary-foreground border-none"
        >
          {tagName}
        </code>
        {Object.entries(rest).map(([k, v]) => {
          if (typeof v !== 'string') return;

          return (
            <code
              key={k}
              data-highlight-ignore=""
              className="not-prose truncate text-xs text-muted-foreground px-1"
            >
              <span className="text-card-foreground">{k}: </span>
              {v}
            </code>
          );
        })}
        {children && <span className="ps-1">{children}</span>}
      </span>
    );
  },
  pre(props: ComponentProps<'pre'>) {
    return (
      <pre
        {...props}
        className={cn(
          'not-prose flex flex-col border rounded-md my-0.5 p-2 bg-secondary text-secondary-foreground max-h-20 overflow-hidden *:mask-[linear-gradient(to_bottom,white,white_30px,transparent_80px)]',
          props.className,
        )}
      />
    );
  },
};

const renderOptions: Options = { development: false, components: mdComponents, ...JsxRuntime };

function Children({ children }: { children?: ReactNode }) {
  return children;
}

function TableCell(props: ComponentProps<'div'>) {
  return <div {...props} className="min-w-0 not-last:truncate last:line-clamp-2" />;
}

const tableRenderOptions: Options = {
  ...renderOptions,
  components: {
    ...mdComponents,
    table: Children,
    thead: Children,
    tbody: Children,
    tr: Children,
    th: TableCell,
    td: TableCell,
  },
};

const rowRenderOptions: Options = {
  ...tableRenderOptions,
  components: { ...tableRenderOptions.components, thead: () => null },
};

export function SearchDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  isLoading = false,
  data,
  error,
  onSelect: onSelectProp,
  children,
  dialogHandle,
}: SearchDialogProps) {
  const router = useRouter();
  const onOpenChangeCallback = useRef(onOpenChange);
  onOpenChangeCallback.current = onOpenChange;
  const onSearchChangeCallback = useRef(onSearchChange);
  onSearchChangeCallback.current = onSearchChange;
  const onSelect = (item: SearchItemType) => {
    if (item.type === 'action') {
      item.onSelect();
    } else if (item.external) {
      window.open(item.url, '_blank')?.focus();
    } else {
      router.push(item.url);
    }

    onOpenChange(false);
    onSelectProp?.(item);
  };
  const onSelectCallback = useRef(onSelect);
  onSelectCallback.current = onSelect;

  const activeItem = useMemo(() => {
    let active: string | null = null;
    const listeners = new Set<() => void>();

    return {
      getActive: () => active,
      setActive(id: string | null) {
        active = id;
        for (const listener of listeners) listener();
      },
      subscribeActive(listener: () => void) {
        listeners.add(listener);
        return () => void listeners.delete(listener);
      },
    };
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} handle={dialogHandle}>
      <SearchDialogContext
        value={useMemo(
          () => ({
            ...activeItem,
            open,
            search,
            isLoading,
            data,
            error,
            query: data ? data.query : search,
            onOpenChange: (v) => onOpenChangeCallback.current(v),
            onSearchChange: (v) => onSearchChangeCallback.current(v),
            onSelect: (v) => onSelectCallback.current(v),
          }),
          [activeItem, isLoading, open, search, data, error],
        )}
      >
        {children}
      </SearchDialogContext>
    </Dialog.Root>
  );
}

export function SearchDialogHeader(props: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex flex-row items-center gap-2 p-3', props.className)} />;
}

export function SearchDialogInput(props: ComponentProps<'input'>) {
  const t = useTranslations();
  const { search, onSearchChange, getActive, subscribeActive } = useSearch();
  const active = useSyncExternalStore(subscribeActive, getActive, getActive);

  return (
    <input
      data-search-dialog-input=""
      role="combobox"
      aria-expanded={active !== null}
      aria-activedescendant={active !== null ? `search-option-${active}` : undefined}
      aria-label={t('Search', { note: 'ui.search_dialog' })}
      aria-autocomplete="list"
      aria-controls="search-list"
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder={t('Search', { note: 'ui.search_dialog' })}
      {...props}
      className={cn(
        'w-0 flex-1 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:outline-none',
        props.className,
      )}
    />
  );
}

export function SearchDialogClose({
  children = 'ESC',
  className,
  ...props
}: ComponentProps<'button'>) {
  const { onOpenChange } = useSearch();
  const t = useTranslations();

  return (
    <button
      type="button"
      aria-label={t('Close Search', { note: 'ui.search_close' })}
      onClick={() => onOpenChange(false)}
      className={cn(
        buttonVariants({
          variant: 'outline',
          size: 'sm',
          className: 'font-mono text-muted-foreground',
        }),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SearchDialogFooter(props: ComponentProps<'div'>) {
  return <div {...props} className={cn('bg-secondary/50 p-3 empty:hidden', props.className)} />;
}

export function SearchDialogOverlay({
  className,
  ...props
}: ComponentProps<typeof Dialog.Backdrop>) {
  return (
    <Dialog.Backdrop
      {...props}
      className={(s) =>
        cn(
          'fixed inset-0 z-50 backdrop-blur-xs bg-overlay data-open:animate-fade-in data-closed:animate-fade-out',
          typeof className === 'function' ? className(s) : className,
        )
      }
    />
  );
}

export function SearchDialogContent({
  ref,
  children,
  className,
  ...props
}: ComponentProps<typeof Dialog.Popup>) {
  const t = useTranslations();
  const localRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog.Portal>
      <Dialog.Popup
        id="search-dialog-content"
        ref={mergeRefs(ref, localRef)}
        aria-describedby={undefined}
        initialFocus={(s) => {
          const input = localRef.current?.querySelector<HTMLInputElement>(
            'input[data-search-dialog-input]',
          );
          if (s === 'touch') {
            input?.focus({ preventScroll: true });
            return false;
          }
          return input;
        }}
        className={(s) =>
          cn(
            'fixed left-1/2 top-4 md:top-[calc(50%_-_250px)] z-50 w-[calc(100%_-_1rem)] max-w-screen-sm -translate-x-1/2 rounded-xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden data-closed:animate-dialog-out data-open:animate-dialog-in focus-visible:outline-none',
            '*:border-b *:has-[+:last-child[data-empty=true]]:border-b-0 *:data-[empty=true]:border-b-0 *:last:border-b-0',
            typeof className === 'function' ? className(s) : className,
          )
        }
        {...props}
      >
        <Dialog.Title className="hidden">{t('Search', { note: 'ui.search_dialog' })}</Dialog.Title>
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export function SearchDialogList({
  items: itemsProp,
  defaultItems = null,
  Empty = () => (
    <div role="status" className="py-12 text-center text-sm text-muted-foreground">
      <T text="ui.search_empty" />
    </div>
  ),
  Item = (props) => <SearchDialogListItem {...props} />,
  Table = (props) => <SearchDialogListTable {...props} />,
  ...props
}: Omit<ComponentProps<'div'>, 'children'> & {

  items?: (SearchItemType | SearchResultItem)[] | null;

  defaultItems?: (SearchItemType | SearchResultItem)[] | null;

  Empty?: () => ReactNode;

  Item?: ItemRenderer;

  Table?: (props: TableProps) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations();
  const { onSelect, data, error, getActive, setActive } = useSearch();
  const items = itemsProp === undefined ? (data?.items ?? defaultItems) : itemsProp;

  useLayoutEffect(
    () => setActive(error ? null : (items?.[0]?.id ?? null)),
    [setActive, items, error],
  );

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!items || e.isComposing || e.keyCode === 229) return;
    const list = flattenItems(items);

    if (e.key === 'ArrowDown' || e.key == 'ArrowUp') {
      let idx = list.findIndex((item) => item.id === getActive());
      if (idx === -1) idx = 0;
      else if (e.key === 'ArrowDown') idx++;
      else idx--;

      setActive(list.at(idx % list.length)?.id ?? null);
      e.preventDefault();
    }

    if (e.key === 'Enter') {
      const selected = list.find((item) => item.id === getActive());

      if (selected) onSelect(selected);
      e.preventDefault();
    }
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => {
      let height = 0;
      for (const child of element.children) height += (child as HTMLElement).offsetHeight;

      element.style.setProperty('--animated-height', `${height}px`);
    });

    for (const child of element.children) observer.observe(child);

    const content: Pick<Window, 'addEventListener' | 'removeEventListener'> =
      document.getElementById('search-dialog-content') ?? window;
    content.addEventListener('keydown', onKey);
    return () => {
      observer.disconnect();
      content.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      {...props}
      ref={ref}
      data-empty={items === null && !error}
      className={cn(
        'overflow-hidden h-(--animated-height) transition-[height]',
        props.className,
      )}
    >
      <p
        role="status"
        className={cn('truncate text-sm not-empty:p-3', items && 'not-empty:border-b')}
      >
        {error && (
          <>
            <CircleAlert className="inline size-5 me-2 align-top text-error" />
            {data ? (
              <T
                text="ui.search_failed_results"
                variables={{
                  query: <span className="font-medium">{data.query}</span>,
                }}
              />
            ) : (
              <T text="ui.search_failed" />
            )}
          </>
        )}
      </p>
      <div
        id="search-list"

        role={items?.length ? 'listbox' : undefined}
        aria-label={items?.length ? t('Search', { note: 'ui.search_dialog' }) : undefined}
        className={cn('w-full flex flex-col overflow-y-auto max-h-[460px] p-1 scrollbar-thin', !items && 'hidden')}
      >
        {items?.length === 0 && Empty()}

        {items?.map((item) => (
          <Fragment key={item.id}>
            {item.type === 'table'
              ? Table({ table: item, Item, onSelect })
              : Item({ item, onClick: () => onSelect(item) })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function flattenItems(items: (SearchItemType | SearchResultItem)[]): SearchItemType[] {
  const out: SearchItemType[] = [];
  for (const item of items) {
    if (item.type === 'table') out.push(...item.rows);
    else out.push(item);
  }

  return out;
}

export function SearchDialogListTable({ table, Item, onSelect }: TableProps) {
  const { query } = useSearch();
  const highlightRef = useHighlightQuery(query);
  const headerId = `search-table-${table.id}`;
  const header = useMemo(
    () => table.header && toJsxRuntime(table.header, tableRenderOptions),
    [table.header],
  );

  return (
    <div

      role={table.header ? 'group' : undefined}
      aria-labelledby={table.header ? headerId : undefined}
      className="ms-3 shrink-0 border-s py-2 ps-3.25 pe-2.5"
    >
      <div
        className="grid gap-x-3 overflow-hidden rounded-lg border bg-card text-sm"
        style={{
          gridTemplateColumns: `${'fit-content(30%) '.repeat(table.columns - 1)}minmax(30%, 1fr)`,
        }}
      >
        {header && (
          <div
            id={headerId}
            ref={highlightRef}
            aria-hidden
            className="col-span-full grid grid-cols-subgrid bg-secondary px-3 py-1 text-xs text-muted-foreground"
          >
            {header}
          </div>
        )}
        {table.rows.map((row) => (
          <Fragment key={row.id}>
            {Item({ item: row, table, onClick: () => onSelect(row) })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function SearchDialogListItem({
  item,
  table,
  className,
  children,
  renderMarkdown,
  badge,
  ...props
}: ComponentProps<'div'> & {

  table?: SearchResultTable;

  renderMarkdown?: (v: string) => ReactNode;
  badge?: ReactNode;
  item: SearchItemType;
}) {
  const { query, getActive, setActive, subscribeActive } = useSearch();
  const isActive = () => getActive() === item.id;
  const active = useSyncExternalStore(subscribeActive, isActive, isActive);
  const highlightRef = useHighlightQuery(query);
  const content = useMemo(() => {
    if (item.type === 'action') return item.node;
    if (renderMarkdown && typeof item.content === 'string') return renderMarkdown(item.content);
    if (!('hastContent' in item)) return item.content;
    if (!table) return toJsxRuntime(item.hastContent, renderOptions);
    return toJsxRuntime(item.hastContent, table.header ? rowRenderOptions : tableRenderOptions);
  }, [item, renderMarkdown, table]);

  if (item.type === 'action') {
    children ??= content;
  } else if (table) {
    children ??= (
      <div
        ref={highlightRef}
        className={cn(
          'contents',

          !table.header &&
            '*:first:font-medium *:first:text-primary *:nth-2:text-xs *:not-first:text-muted-foreground',
        )}
      >
        {content}
      </div>
    );
  } else {
    children ??= (
      <>
        {badge != null && (
          <span className="absolute end-2 top-1.5 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/80">
            {badge}
          </span>
        )}
        <div
          className={cn(
            'inline-flex items-center text-muted-foreground text-xs empty:hidden',
            badge != null && 'pe-14',
          )}
        >
          {item.breadcrumbs?.map((item, i) => (
            <Fragment key={i}>
              {i > 0 && <ChevronRight className="size-4 rtl:rotate-180" />}
              {item}
            </Fragment>
          ))}
        </div>

        {item.type !== 'page' && (
          <div role="none" className="absolute inset-s-3 inset-y-0 w-px bg-border" />
        )}
        {item.type === 'heading' && (
          <Hash className="absolute inset-s-6 top-2.5 size-4 text-muted-foreground" />
        )}
        <div
          ref={highlightRef}
          className={cn(
            'prose prose-sm min-w-0',
            item.type === 'text' && 'ps-4',
            item.type === 'heading' && 'ps-8',
            item.type === 'page' || item.type === 'heading'
              ? 'font-medium text-inherit'
              : 'text-popover-foreground/80',
          )}
        >
          {content}
        </div>
      </>
    );
  }

  return (
    <div
      id={`search-option-${item.id}`}
      role="option"
      ref={useCallback(
        (element: HTMLDivElement | null) => {
          if (active && element) {
            scrollIntoView(element, {
              scrollMode: 'if-needed',
              block: 'nearest',
              boundary: element.closest('[role="listbox"]'),
            });
          }
        },
        [active],
      )}
      aria-selected={active}
      className={cn(
        'cursor-default',
        table
          ? 'col-span-full grid grid-cols-subgrid items-baseline px-3 py-1.5 not-first:border-t'
          : 'relative shrink-0 px-2.5 py-2 text-sm overflow-hidden rounded-lg',
        active && 'bg-accent text-accent-foreground',
        className,
      )}
      onPointerMove={() => setActive(item.id)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SearchDialogIcon(props: ComponentProps<'svg'>) {
  const { isLoading } = useSearch();

  return (
    <SearchIcon
      {...props}
      className={cn(
        'size-5 text-muted-foreground',
        isLoading && 'animate-pulse duration-400',
        props.className,
      )}
    />
  );
}

export interface SearchTagsListProps extends ComponentProps<'div'> {
  tag?: string;
  onTagChange: (tag: string | undefined) => void;
  allowClear?: boolean;
}

const itemVariants = cva(
  'rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors',
  {
    variants: {
      active: {
        true: 'bg-accent text-accent-foreground',
      },
    },
  },
);
export function SearchTagsList({ tag, onTagChange, allowClear = false, ...props }: SearchTagsListProps) {
  const onTagChangeCallback = useRef(onTagChange);
  onTagChangeCallback.current = onTagChange;
  return (
    <div {...props} className={cn('flex items-center gap-1 flex-wrap', props.className)}>
      <SearchTagsListContext
        value={useMemo(
          () => ({
            value: tag,
            onValueChange: (v) => onTagChangeCallback.current(v),
            allowClear,
          }),
          [allowClear, tag],
        )}
      >
        {props.children}
      </SearchTagsListContext>
    </div>
  );
}

export function SearchTagsListItem({
  value,
  className,
  ...props
}: ComponentProps<'button'> & {
  value: string;
}) {
  const { onValueChange, value: selectedValue, allowClear } = useSearchTagsList();
  const selected = value === selectedValue;

  return (
    <button
      type="button"
      data-active={selected}
      className={cn(itemVariants({ active: selected, className }))}
      onClick={() => onValueChange(selected && allowClear ? undefined : value)}
      tabIndex={-1}
      {...props}
    >
      {props.children}
    </button>
  );
}

