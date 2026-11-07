'use client';

import type { ReactNode } from 'react';
import { CloudOff } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { requestDumpRetry } from '@terrafirmagreg-team/data/lib/dump-status';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function DumpUnavailable({ children }: { children?: ReactNode }) {
  const t = useTranslations();
  return (
    <div className="pointer-events-auto flex max-w-xs flex-col items-center gap-2.5 rounded-lg border border-border bg-popover px-5 py-4 text-center shadow-lg">
      <CloudOff className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {children ??
          t('Section data is temporarily unavailable. Try again later.', {
            note: 'kit.section_unavailable',
          })}
      </p>
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

export function DumpUnavailableOverlay({ children }: { children?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6">
      {children ?? <DumpUnavailable />}
    </div>
  );
}
