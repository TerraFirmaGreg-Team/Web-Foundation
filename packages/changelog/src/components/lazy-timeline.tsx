'use client';
import { useEffect, useRef, useState } from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { ChangelogTimeline } from './timeline';
import { ChangelogBrowserFallback } from './browser-fallback';
import { changelogDepsOrNull } from '../lib/config';
import type { ChangelogTimelineEntry } from '../types';

const PAGE_SIZE = 20;

export function ChangelogLazyTimeline({
  entries,
  lang,
  more,
}: {
  entries: ChangelogTimelineEntry[];
  lang: Lang;
  more?: { dataset: string; total: number };
}) {
  const [extra, setExtra] = useState<ChangelogTimelineEntry[]>([]);
  const [done, setDone] = useState(false);
  const loading = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const loaded = entries.length + extra.length;
  const hasMore = !done && more !== undefined && loaded < more.total;
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || !more) return;
    const observer = new IntersectionObserver(([hit]) => {
      if (!hit?.isIntersecting || loading.current) return;
      loading.current = true;
      const load = changelogDepsOrNull()?.loadEntries;
      if (!load) {
        setDone(true);
        loading.current = false;
        return;
      }
      load(more.dataset, lang, loaded, PAGE_SIZE)
        .then((batch) => {
          if (batch?.length) setExtra((prev) => [...prev, ...batch]);
          if (!batch?.length || batch.length < PAGE_SIZE) setDone(true);
        })
        .catch(() => setDone(true))
        .finally(() => {
          loading.current = false;
        });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, more, lang, loaded]);
  return (
    <>
      <ChangelogTimeline entries={[...entries, ...extra]} lang={lang} />
      {hasMore ? (
        <div ref={sentinel}>
          <ChangelogBrowserFallback />
        </div>
      ) : null}
    </>
  );
}
