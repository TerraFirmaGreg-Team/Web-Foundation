'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ComponentProps, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useSearchContext } from '@terrafirmagreg-team/ui/hooks/search/use-provider';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';

export function LeftSidebarSearchTrigger({
  label,
  hint,
  keys = ['Ctrl', 'K'],
  icon,
  className,
  ...props
}: ComponentProps<'button'> & {
  label?: ReactNode;
  hint?: ReactNode;
  keys?: readonly ReactNode[];
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      data-slot="left-sidebar-search-trigger"
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-xl border bg-secondary/50 ps-2.5 pe-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {icon ?? <Search className="size-4" aria-hidden />}
      <span className="flex-1 truncate text-start">{label}</span>
      {hint ?? (
        <span className="ms-auto inline-flex gap-0.5" aria-hidden>
          {keys.map((k, i) => (
            <kbd key={i} className="rounded-md border bg-background px-1.5">
              {k}
            </kbd>
          ))}
        </span>
      )}
    </button>
  );
}

export function LeftSidebarSearch({
  variant = 'full',
}: {
  variant?: 'full' | 'icon';
}) {
  const { enabled, hotKey, setOpenSearch } = useSearchContext();
  const t = useTranslations();
  if (!enabled) return null;
  if (variant === 'icon')
    return (
      <IconButton
        label={t('Search', { note: 'ui.search_trigger' })}
        variant="ghost"
        size="icon-sm"
        tooltip={false}
        onClick={() => setOpenSearch(true)}
      >
        <Search />
      </IconButton>
    );
  return (
    <LeftSidebarSearchTrigger
      label={t('Search', { note: 'ui.search_trigger' })}
      onClick={() => setOpenSearch(true)}
      keys={hotKey?.map((k) => k.display)}
    />
  );
}

