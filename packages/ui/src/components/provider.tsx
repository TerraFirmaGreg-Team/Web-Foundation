'use client';
import Link from 'next/link';
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import {
  ThemeProvider,
  useTheme,
  type ThemeProviderProps,
} from 'next-themes';
import { TranslationProvider } from '@terrafirmagreg-team/translate';
import { useHotKey } from '@terrafirmagreg-team/ui/hooks/use-hot-key';

export type UiLinkProps = { href: string; prefetch?: boolean } & Omit<
  ComponentProps<'a'>,
  'href'
>;

export type UiComponents = {
  Link?: ComponentType<UiLinkProps>;
};

const defaults: Required<UiComponents> = {
  Link: Link as ComponentType<UiLinkProps>,
};

const UiComponentsContext = createContext<UiComponents | null>(null);

export function UiProvider({
  components,
  translations,
  children,
}: {
  components?: UiComponents;
  translations?: Record<string, string>;
  children: ReactNode;
}) {
  const parent = useContext(UiComponentsContext);
  const merged = useMemo(
    () => ({ ...parent, ...components }),
    [parent, components],
  );
  const inner = (
    <UiComponentsContext.Provider value={merged}>
      {children}
    </UiComponentsContext.Provider>
  );
  if (!translations) return inner;
  return (
    <TranslationProvider translations={translations}>
      {inner}
    </TranslationProvider>
  );
}

export function useUiComponents(): Required<UiComponents> {
  return { ...defaults, ...useContext(UiComponentsContext) };
}

export interface ThemeOptions extends ThemeProviderProps {

  enabled?: boolean;

  hotKey?: string | ((e: KeyboardEvent) => boolean) | false;
}

function ThemeHotKey({
  hotKey,
}: {
  hotKey: Exclude<ThemeOptions['hotKey'], false | undefined>;
}) {
  const { setTheme, resolvedTheme } = useTheme();

  useHotKey(
    (e) => {

      const matched =
        typeof hotKey === 'string'
          ? !e.metaKey &&
            !e.ctrlKey &&
            !e.altKey &&
            e.key.toLowerCase() === hotKey.toLowerCase()
          : hotKey(e);
      if (!matched) return;

      e.preventDefault();
      const next = resolvedTheme === 'dark' ? 'light' : 'dark';
      if (document?.startViewTransition) {
        document.startViewTransition(() => flushSync(() => setTheme(next)));
      } else {
        setTheme(next);
      }
    },
    { ignoreTyping: true },
  );

  return null;
}

export function UiRootProvider({
  children,
  dir = 'ltr',
  theme = {},
}: {
  children?: ReactNode;

  dir?: 'rtl' | 'ltr';

  theme?: ThemeOptions;
}) {
  let body = children;

  if (theme?.enabled !== false) {
    const { enabled: _, hotKey = 'd', ...themeProps } = theme;

    body = (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...themeProps}
      >
        {hotKey !== false && <ThemeHotKey hotKey={hotKey} />}
        {body}
      </ThemeProvider>
    );
  }

  return <DirectionProvider direction={dir}>{body}</DirectionProvider>;
}

