'use client';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

function LanguagesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </svg>
  );
}

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
        <LanguagesIcon className="size-3" />
        {t('Untranslated', { note: 'untranslated.chip' })}
      </span>
    </Hint>
  );
}
