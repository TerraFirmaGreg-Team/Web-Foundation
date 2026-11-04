'use client';
import {
  type ComponentType,
  type ReactNode,
  Suspense,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useHotKey } from '@terrafirmagreg-team/ui/hooks/use-hot-key';
import {
  dialogHandle,
  SearchContext,
  useSearchContext,
} from '@terrafirmagreg-team/ui/hooks/search/use-provider';
import type { SharedProps } from '@terrafirmagreg-team/ui/types/search';
export type { SharedProps } from '@terrafirmagreg-team/ui/types/search';

interface HotKey {
  display: ReactNode;

  key: string | ((e: KeyboardEvent) => boolean);
}

export type SearchLink = [name: string, href: string];

export interface TagItem {
  name: string;
  value: string;
}

export interface SearchProviderProps<DialogProps extends SharedProps = SharedProps> {

  links?: SearchLink[];

  hotKey?: HotKey[];

  SearchDialog: ComponentType<DialogProps>;

  options?: Partial<DialogProps>;

  children?: ReactNode;
}

const noop = () => () => {};

function MetaOrControl() {

  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  return isClient && /Windows|Linux/i.test(navigator.userAgent) ? 'Ctrl' : '⌘';
}

const DEFAULT_HOT_KEYS: HotKey[] = [
  {
    key: (e) => e.metaKey || e.ctrlKey,
    display: <MetaOrControl />,
  },
  {
    key: 'k',
    display: 'K',
  },
];

export function SearchProvider<DialogProps extends SharedProps = SharedProps>({
  SearchDialog,
  children,
  options,
  hotKey = DEFAULT_HOT_KEYS,
  links,
}: SearchProviderProps<DialogProps>) {
  const [isOpen, setIsOpen] = useState(false);
  useHotKey((e) => {
    if (hotKey.every((v) => (typeof v.key === 'string' ? e.key === v.key : v.key(e)))) {
      setIsOpen((open) => !open);
      e.preventDefault();
    }
  });

  return (
    <SearchContext
      value={useMemo(
        () => ({
          enabled: true,
          open: isOpen,
          hotKey,
          dialogHandle,
          setOpenSearch: setIsOpen,
        }),
        [isOpen, hotKey],
      )}
    >
      <Suspense fallback={null}>
        {/* @ts-expect-error -- assume all required props are filled */}
        <SearchDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          links={links}
          dialogHandle={dialogHandle}
          {...options}
        />
      </Suspense>

      {children}
    </SearchContext>
  );
}

export function SearchOnly({ children }: { children: ReactNode }) {
  const search = useSearchContext();

  if (search.enabled) return children;
}

