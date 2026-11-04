'use client';
import useSWRImmutable from 'swr/immutable';
import { usePathname } from 'next/navigation';
import { Eye } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate';
import type { HTMLAttributes } from 'react';

export interface ViewCountProps extends HTMLAttributes<HTMLElement> {

  path?: string;
  apiUrl?: string;
}

export function ViewCount({
  path,
  apiUrl = '/api/analytics',
  ...props
}: ViewCountProps) {
  const pathname = usePathname();
  const key = path ?? pathname;
  const t = useTranslations();
  const { data } = useSWRImmutable(['analytics-view', key], async () => {
    const res = await fetch(`${apiUrl}?path=${encodeURIComponent(key)}`);
    return res.ok ? ((await res.json()) as { views: number }).views : 0;
  });
  return (
    <span title={t('Views', { note: 'ui.views' })} aria-label={t('Views', { note: 'ui.views' })} {...props}>
      <Eye className="size-3.5" aria-hidden />
      {data ?? '—'}
    </span>
  );
}

