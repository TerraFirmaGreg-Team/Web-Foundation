'use client';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { monthLabel } from '@terrafirmagreg-team/changelog/lib/format';

export function ChangelogMonthLabel({ monthKey }: { monthKey: string }) {
  const lang = useResolvedLang();
  const [year, month] = monthKey.split('-').map(Number);
  return <>{monthLabel(lang, new Date(Date.UTC(year, month - 1)))}</>;
}
