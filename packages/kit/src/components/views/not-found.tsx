'use client';
import { useEffect, useRef } from 'react';
import { FileQuestion } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sectionUrl } from '@terrafirmagreg-team/sites/location';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { LangLink } from '@terrafirmagreg-team/ui/components/blocks/lang/link';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { requestDumpRetry } from '@terrafirmagreg-team/data/lib/dump-status';
import { useDumpStatus } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
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
      <div className="flex flex-col items-center gap-3 py-16">
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
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <FileQuestion className="size-10" />
      <p>{t('Page not found', { note: 'ui.not_found' })}</p>
      <LangLink
        href={sectionUrl(section, datasets[0].id)}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'xs' }),
          'no-underline',
        )}
      >
        {t('Back', { note: 'ui.back' })}
      </LangLink>
    </div>
  );
}
