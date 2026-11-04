'use client';
import { Callout } from '@terrafirmagreg-team/ui/components/mdx/callout';
import { useUntranslated } from '@terrafirmagreg-team/ui/hooks/use-lang';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';

export function UntranslatedCallout({
  copied,
}: {

  copied?: TranslationState;
}) {
  const missing = useUntranslated();
  const t = useTranslations();
  if (!missing && !copied) return null;
  const full = missing || copied === 'untranslated';
  return (
    <Callout
      type="warn"
      title={
        full ? t('This page is not translated', { note: 'untranslated.title' }) : t('This page is not fully translated', { note: 'untranslated.partial_title' })
      }
      className="shrink-0"
    >
      <p>{full ? t('Showing the English version. A translation is not available yet.', { note: 'untranslated.body' }) : t('Some content is still shown in English.', { note: 'untranslated.partial_body' })}</p>
    </Callout>
  );
}

