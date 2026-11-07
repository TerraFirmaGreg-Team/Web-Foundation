'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isSectionKey, sectionUrl } from '@terrafirmagreg-team/sites/location';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { LangLink } from '@terrafirmagreg-team/ui/components/blocks/lang/link';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { requestDumpRetry } from '@terrafirmagreg-team/data/lib/dump-status';
import { useDumpStatus } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { useSectionCatalog } from '@terrafirmagreg-team/kit/hooks/use-catalog';
import type { SectionDataset, SectionKey } from '@terrafirmagreg-team/kit/types';

export function SectionNotFound({
  section,
  datasets,
}: {
  section: SectionKey;
  datasets: readonly SectionDataset[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const { statuses } = useDumpStatus();
  const hadFailure = useRef(false);
  const anyFailed = Object.values(statuses).some(
    (state) => state.status === 'failed',
  );
  useEffect(() => {
    if (anyFailed) {
      hadFailure.current = true;
      return;
    }
    if (hadFailure.current && Object.keys(statuses).length) {
      hadFailure.current = false;
      router.refresh();
    }
  }, [anyFailed, statuses, router]);

  if (!datasets.length)
    return (
      <div className="mx-2 flex min-w-0 flex-1 flex-col items-center justify-center gap-3 bg-background [grid-area:main] md:my-2 md:overflow-clip md:rounded-2xl md:border md:shadow-sm">
        <EmptyState variant="missing">
          {t('Section data is temporarily unavailable. Try again later.', {
            note: 'kit.section_unavailable',
          })}
        </EmptyState>
        <button
          type="button"
          onClick={requestDumpRetry}
          className={cn(buttonVariants({ variant: 'outline', size: 'xs' }))}
        >
          {t('Retry now', { note: 'kit.retry_now' })}
        </button>
      </div>
    );
  return (
    <div className="mx-2 flex min-w-0 flex-1 flex-col items-center justify-center gap-6 bg-background [grid-area:main] md:my-2 md:overflow-clip md:rounded-2xl md:border md:shadow-sm">
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden
          className="select-none text-6xl leading-none font-semibold tracking-tighter text-muted-foreground/25"
        >
          404
        </span>
        <p className="font-medium text-foreground">
          {t('Page not found', { note: 'ui.not_found' })}
        </p>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">
          {t("The page you're looking for doesn't exist or was moved.", {
            note: 'ui.not_found_description',
          })}
        </p>
      </div>
      <LangLink
        href={sectionUrl(section, datasets[0].id)}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'no-underline',
        )}
      >
        {t('Back', { note: 'ui.back' })}
      </LangLink>
    </div>
  );
}

export function RootNotFound() {
  const pathname = usePathname();
  const catalog = useSectionCatalog();
  const t = useTranslations();
  const parts = pathname.split('/').filter(Boolean);
  const section = isSectionKey(parts[0]) ? parts[0] : undefined;
  const datasets = section ? catalog[section] : undefined;
  const known = datasets?.some((dataset) => dataset.id === parts[1]);
  const href =
    section && datasets?.length
      ? `/${section}/${known ? parts[1] : datasets[0].id}`
      : '/';

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden
          className="select-none bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/10 bg-clip-text text-[8rem] leading-none font-semibold tracking-tighter text-transparent"
        >
          404
        </span>
        <h1 className="text-xl font-semibold text-foreground">
          {t('Page not found', { note: 'ui.not_found' })}
        </h1>
        <p className="max-w-sm text-sm text-balance text-muted-foreground">
          {t("The page you're looking for doesn't exist or was moved.", {
            note: 'ui.not_found_description',
          })}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LangLink
          href={href}
          className={cn(buttonVariants({ size: 'sm' }), 'no-underline')}
        >
          {t('Back', { note: 'ui.back' })}
        </LangLink>
        <LangLink
          href="/"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'no-underline',
          )}
        >
          {t('Go home', { note: 'ui.go_home' })}
        </LangLink>
      </div>
    </main>
  );
}
