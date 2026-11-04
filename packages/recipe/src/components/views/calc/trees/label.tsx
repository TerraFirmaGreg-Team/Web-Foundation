'use client';

import { Workflow } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import type { CalcTreeEntry } from '@terrafirmagreg-team/recipe/lib/calc/storage';
import type { EntryMeta } from '@terrafirmagreg-team/recipe/lib/calc/meta';

export function TreeIcon({
  entry,
  dataset,
  lang,
  langMap,
}: { entry: CalcTreeEntry } & EntryMeta) {
  const card = entry.state.cards?.[0];
  const ref = entry.icon ?? (card && { id: card.materialId, kind: card.kind });
  if (!ref) return <Workflow className="size-4 shrink-0" />;
  return (
    <Entry
      id={ref.id}
      kind={ref.kind}
      dataset={dataset}
      lang={lang}
      langMap={langMap}
      size="sm"
      href={false}
      tooltip={false}
      className="shrink-0"
    />
  );
}

export function TreeLabel({
  entry,
  langMap,
}: { entry: CalcTreeEntry } & EntryMeta) {
  const t = useTranslations();
  const card = entry.state.cards?.[0];
  const text =
    entry.name ??
    (card ? langMap?.[card.materialId] || card.materialId : undefined) ??
    t('Untitled scheme', { note: 'recipe.calc.tab.untitled' });
  return (
    <span className="min-w-0 flex-1 truncate text-start">
      {text}
    </span>
  );
}

export function TreeDate({
  savedAt,
  lang,
}: {
  savedAt: number;
  lang: string;
}) {
  const stamp = new Intl.DateTimeFormat(lang.replace(/_/g, '-'), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(savedAt);
  return (
    <span className="shrink-0 text-xs tabular-nums text-muted-foreground/70">
      {stamp}
    </span>
  );
}

