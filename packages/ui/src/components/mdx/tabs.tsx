'use client';

import * as React from 'react';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  use,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { mergeRefs } from '@terrafirmagreg-team/ui/lib/utils/merge-refs';
import { Tabs as Primitive } from '@base-ui/react/tabs';

type ChangeListener = (v: string) => void;
const listeners = new Map<string, Set<ChangeListener>>();

export interface BaseTabsProps extends ComponentProps<typeof Primitive.Root> {

  groupId?: string;

  persist?: boolean;

  updateAnchor?: boolean;

  onValueChange?: (value: string) => void;
}

const BaseTabsContext = createContext<{
  valueToIdMap: Map<string, string>;

  panels: Map<string, HTMLElement>;

  triggers: Set<string>;
} | null>(null);

function useBaseTabContext() {
  const ctx = use(BaseTabsContext);
  if (!ctx) throw new Error('You must wrap your component in <BaseTabs>');
  return ctx;
}

export const BaseTabsList = Primitive.List;

export function BaseTabsTrigger({ value, ref, ...props }: ComponentProps<typeof Primitive.Tab>) {
  const { triggers } = useBaseTabContext();

  return (
    <Primitive.Tab
      ref={mergeRefs(ref, (element) => {
        if (element) triggers.add(value);
        else triggers.delete(value);
      })}
      value={value}
      {...props}
    />
  );
}

export function BaseTabs({
  ref,
  groupId,
  persist = false,
  updateAnchor = false,
  defaultValue,
  value: _value,
  onValueChange: _onValueChange,
  ...props
}: BaseTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const valueToIdMap = useMemo(() => new Map<string, string>(), []);
  const panels = useMemo(() => new Map<string, HTMLElement>(), []);
  const triggers = useMemo(() => new Set<string>(), []);
  const [value, setValue] =
    _value === undefined
      ? // eslint-disable-next-line react-hooks/rules-of-hooks -- not supposed to change controlled/uncontrolled
        useState(defaultValue)
      : // eslint-disable-next-line react-hooks/rules-of-hooks -- not supposed to change controlled/uncontrolled
        [_value, (v: string) => _onValueChange?.(v)];

  const onChange = useEffectEvent((v: string) => {
    if (triggers.has(v)) setValue(v);
  });

  const openFromHash = useEffectEvent(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    for (const [value, id] of valueToIdMap.entries()) {
      if (id === hash) {
        setValue(value);
        tabsRef.current?.scrollIntoView();
        return;
      }
    }

    const target = document.getElementById(hash);
    if (!target) return;

    for (const [value, panel] of panels.entries()) {
      if (!panel.contains(target)) continue;

      setValue(value);
      requestAnimationFrame(() => target.scrollIntoView());
      return;
    }
  });

  useLayoutEffect(() => {
    if (!groupId) return;
    let previous = sessionStorage.getItem(groupId);
    if (persist) previous ??= localStorage.getItem(groupId);
    if (previous) onChange(previous);

    const groupListeners = listeners.get(groupId) ?? new Set();
    groupListeners.add(onChange);
    listeners.set(groupId, groupListeners);
    return () => {
      groupListeners.delete(onChange);
    };
  }, [groupId, persist]);

  useLayoutEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, []);

  return (
    <Primitive.Root
      ref={mergeRefs(ref, tabsRef)}
      value={value}
      onValueChange={(v: string) => {
        if (updateAnchor) {
          const id = valueToIdMap.get(v);

          if (id) {
            window.history.replaceState(null, '', `#${id}`);
          }
        }

        if (groupId) {
          const groupListeners = listeners.get(groupId);
          if (groupListeners) {
            for (const listener of groupListeners) listener(v);
          }

          sessionStorage.setItem(groupId, v);
          if (persist) localStorage.setItem(groupId, v);
        } else {
          setValue(v);
        }
      }}
      {...props}
    >
      <BaseTabsContext
        value={useMemo(
          () => ({ valueToIdMap, panels, triggers }),
          [valueToIdMap, panels, triggers],
        )}
      >
        {props.children}
      </BaseTabsContext>
    </Primitive.Root>
  );
}

export function BaseTabsContent({ value, ref, ...props }: ComponentProps<typeof Primitive.Panel>) {
  const { valueToIdMap, panels } = useBaseTabContext();

  if (props.id) {
    valueToIdMap.set(value, props.id);
  }

  return (
    <Primitive.Panel
      ref={mergeRefs(ref, (element) => {
        if (element) panels.set(value, element);
        else panels.delete(value);
      })}
      value={value}
      {...props}
    >
      {props.children}
    </Primitive.Panel>
  );
}

type CollectionKey = string | symbol;

export interface TabsProps extends Omit<
  ComponentProps<typeof BaseTabs>,
  'value' | 'onValueChange'
> {

  items?: string[];

  defaultIndex?: number;

  label?: ReactNode;
}

const TabsContext = createContext<{
  items?: string[];
  collection: CollectionKey[];
} | null>(null);

function useTabContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('You must wrap your component in <Tabs>');
  return ctx;
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof BaseTabsList>) {
  return (
    <BaseTabsList
      {...props}
      className={(s) =>
        cn(
          'flex gap-3.5 text-secondary-foreground overflow-x-auto px-4 not-prose border-b border-border',
          typeof className === 'function' ? className(s) : className,
        )
      }
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof BaseTabsTrigger>) {
  return (
    <BaseTabsTrigger
      {...props}
      className={(s) =>
        cn(
          'inline-flex items-center gap-2 whitespace-nowrap text-muted-foreground border-b border-transparent py-2 text-sm font-medium transition-colors [&_svg]:size-4 hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[active]:border-primary data-[active]:text-primary',
          typeof className === 'function' ? className(s) : className,
        )
      }
    />
  );
}

export function Tabs({
  ref,
  className,
  items,
  label,
  defaultIndex = 0,
  defaultValue = items ? escapeValue(items[defaultIndex]) : undefined,
  ...props
}: TabsProps) {
  const collection = useMemo<CollectionKey[]>(() => [], []);

  return (
    <BaseTabs
      ref={ref}
      className={(s) =>
        cn(
          'flex flex-col overflow-hidden rounded-xl border bg-secondary my-4',
          typeof className === 'function' ? className(s) : className,
        )
      }
      defaultValue={defaultValue}
      {...props}
    >
      {items && (
        <TabsList>
          {label && <span className="text-sm font-medium my-auto me-auto">{label}</span>}
          {items.map((item) => (
            <TabsTrigger key={item} value={escapeValue(item)}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      <TabsContext.Provider value={useMemo(() => ({ items, collection }), [collection, items])}>
        {props.children}
      </TabsContext.Provider>
    </BaseTabs>
  );
}

export interface TabProps extends Omit<ComponentProps<typeof BaseTabsContent>, 'value'> {

  value?: string;
}

export function Tab({ value, ...props }: TabProps) {
  const { items } = useTabContext();
  const resolved =
    value ??
    // eslint-disable-next-line react-hooks/rules-of-hooks -- `value` is not supposed to change
    items?.at(useCollectionIndex());
  if (!resolved)
    throw new Error(
      'Failed to resolve tab `value`, please pass a `value` prop to the Tab component.',
    );

  return (
    <TabsContent value={escapeValue(resolved)} {...props}>
      {props.children}
    </TabsContent>
  );
}

export function TabsContent({
  value,
  className,
  ...props
}: ComponentProps<typeof BaseTabsContent>) {
  return (
    <BaseTabsContent
      value={value}
      className={(s) =>
        cn(
          'p-4 text-[0.9375rem] bg-background rounded-xl outline-none prose-no-margin data-[inactive]:hidden [&>figure:only-child]:-m-4 [&>figure:only-child]:border-none',
          typeof className === 'function' ? className(s) : className,
        )
      }
      {...props}
    >
      {props.children}
    </BaseTabsContent>
  );
}

function useCollectionIndex() {
  const key = useId();
  const { collection } = useTabContext();

  useEffect(() => {
    return () => {
      const idx = collection.indexOf(key);
      if (idx !== -1) collection.splice(idx, 1);
    };
  }, [key, collection]);

  if (!collection.includes(key)) collection.push(key);
  return collection.indexOf(key);
}

function escapeValue(v: string): string {
  return v.toLowerCase().replace(/\s/, '-');
}

