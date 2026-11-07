'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function StaleBadge({ className }: { className?: string }) {
  const t = useTranslations();
  return (
    <span
      className={cn(
        'pointer-events-none absolute end-3 top-3 z-20 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300',
        className,
      )}
    >
      {t('cached', { note: 'kit.stale_badge' })}
    </span>
  );
}
