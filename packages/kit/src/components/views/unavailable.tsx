'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { requestDumpRetry } from '@terrafirmagreg-team/data/lib/dump-status';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function DumpUnavailable({ children }: { children?: ReactNode }) {
  const t = useTranslations();
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <EmptyState variant="missing">
        {children ??
          t('Section data is temporarily unavailable. Try again later.', {
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
}
