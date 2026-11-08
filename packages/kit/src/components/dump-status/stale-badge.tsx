'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

const SHOW_DELAY_MS = 1500;

export function StaleBadge({ className }: { className?: string }) {
  const t = useTranslations();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
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
