'use client';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Languages } from 'lucide-react';

export function UntranslatedChip({ className }: { className?: string }) {
  const t = useTranslations();
  return (
    <Hint
      side="top"
      label={
        <span className="block max-w-56">
          <span className="mb-0.5 block font-semibold">
            {t('This page is not translated', { note: 'untranslated.title' })}
          </span>
          {t('Showing the English version. A translation is not available yet.', { note: 'untranslated.body' })}
        </span>
      }
    >
      <span
        className={cn(
          'inline-flex cursor-help items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400',
          className,
        )}
      >
        <Languages className="size-3" aria-hidden />
        {t('Untranslated', { note: 'untranslated.chip' })}
      </span>
    </Hint>
  );
}
