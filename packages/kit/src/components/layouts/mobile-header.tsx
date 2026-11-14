'use client';
import { Menu } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { SidebarTrigger } from '@terrafirmagreg-team/ui/components/blocks/sidebar';
import { LeftSidebarSearch } from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { useLayout } from '@terrafirmagreg-team/ui/hooks/use-layout';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import type { SwitcherOption } from '@terrafirmagreg-team/ui/types/nav';

export function MobileHeader({
  sections,
  current,
}: {
  sections: SwitcherOption[];
  current: string;
}) {
  const t = useTranslations();
  const { navTitle: Title } = useLayout();
  const { Link } = useUiComponents();
  return (
    <header
      id="subnav"
      data-slot="layout-header"
      className="sticky top-(--banner-height,0px) z-30 [grid-area:header] flex items-center h-(--header-height) ps-4 pe-2 bg-card md:hidden"
    >
      <Title className="inline-flex items-center gap-2.5 me-3 font-semibold" />
      <div className="ms-auto flex min-w-0 items-center gap-1">
        <SidebarTrigger
          aria-label={t('Menu', { note: 'ui.menu_toggle' })}
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-lg' }))}
        >
          <Menu />
        </SidebarTrigger>
        <LeftSidebarSearch variant="icon" />
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {sections.map((option) => (
            <Link
              key={option.value}
              href={option.url ?? '/'}
              aria-label={typeof option.title === 'string' ? option.title : option.value}
              aria-current={option.value === current ? 'page' : undefined}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'shrink-0',
                option.value === current ? 'bg-accent' : 'text-muted-foreground',
              )}
            >
              {option.icon}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
