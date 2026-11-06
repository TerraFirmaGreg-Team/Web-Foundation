'use client';
import { FileQuestion } from 'lucide-react';
import { sectionUrl } from '@terrafirmagreg-team/sites/location';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { LangLink } from '@terrafirmagreg-team/ui/components/blocks/lang/link';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import type { SectionDataset, SectionKey } from '@terrafirmagreg-team/kit/types';

export function SectionNotFound({
  section,
  datasets,
}: {
  section: SectionKey;
  datasets: readonly SectionDataset[];
}) {
  const t = useTranslations();
  if (!datasets.length)
    return (
      <EmptyState variant="missing">
        {t('Section data is temporarily unavailable. Try again later.', {
          note: 'kit.section_unavailable',
        })}
      </EmptyState>
    );
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
      <FileQuestion className="size-10" />
      <p>{t('Page not found', { note: 'ui.not_found' })}</p>
      <LangLink
        href={sectionUrl(section, datasets[0].id)}
        className="text-sm underline underline-offset-4 transition-colors hover:text-foreground"
      >
        {t('Back', { note: 'ui.back' })}
      </LangLink>
    </main>
  );
}
