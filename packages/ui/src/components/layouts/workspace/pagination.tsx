'use client';
import { type ComponentProps, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from '@terrafirmagreg-team/ui/components/blocks/nav/link';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useFooterItems } from '@terrafirmagreg-team/ui/hooks/use-tree';
import { useLocationSearch } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { isNavItemActive } from '@terrafirmagreg-team/ui/lib/utils/nav-active';
import type { WorkspacePaginationItems } from './workspace';

export function WorkspacePagination({
  items,
  className,
  ...props
}: ComponentProps<'nav'> & { items?: WorkspacePaginationItems }) {
  const footerList = useFooterItems();
  const pathname = usePathname();
  const search = useLocationSearch();
  const { previous, next } = useMemo(() => {
    if (items && (items.previous || items.next)) return items;
    const idx = footerList.findIndex((item) =>
      isNavItemActive(item.url, pathname, search),
    );
    if (idx === -1) return {};
    return { previous: footerList[idx - 1], next: footerList[idx + 1] };
  }, [footerList, items, pathname, search]);

  if (!previous && !next) return null;
  return (
    <nav
      data-slot="workspace-pagination"
      className={cn('@container grid grid-cols-2 gap-3 mt-8', className)}
      {...props}
    >
      {previous && <WorkspacePaginationItem item={previous} next={false} />}
      {next && <WorkspacePaginationItem item={next} next />}
    </nav>
  );
}

function WorkspacePaginationItem({
  item,
  next,
}: {
  item: NonNullable<WorkspacePaginationItems['previous']>;
  next: boolean;
}) {
  const t = useTranslations();
  const Icon = next ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <Link
      href={item.url}
      className={cn(
        'group flex flex-col gap-1 rounded-2xl border p-4 text-sm transition-colors hover:bg-accent/40 @max-md:col-span-full',
        next && 'col-start-2 items-end text-end',
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {!next && (
          <Icon className="size-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180" />
        )}
        {next ? t('Next Page', { note: 'ui.next_page' }) : t('Previous Page', { note: 'ui.prev_page' })}
        {next && (
          <Icon className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        )}
      </span>
      <span className="font-medium">{item.name}</span>
    </Link>
  );
}
