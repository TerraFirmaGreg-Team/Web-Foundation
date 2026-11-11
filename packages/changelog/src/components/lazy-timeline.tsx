'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { ChangelogTimeline } from './timeline';
import { ChangelogBrowserFallback } from './browser-fallback';
import { changelogDepsOrNull } from '../lib/config';
import type { ChangelogTimelineEntry } from '../types';

const PAGE_SIZE = 40;
const PREFETCH_MARGIN = '1600px';
const RESTORE_WINDOW_MS = 5000;

type ScrollMemory = { top: number; ts: number };
const scrollMemory = new Map<string, ScrollMemory>();

function scrollParentOf(node: HTMLElement | null): HTMLElement | null {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === 'auto' || overflowY === 'scroll') return el;
  }
  return null;
}

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
  const savedScroll = useRef(0);
  const scroller = useRef<HTMLElement | null>(null);
  const pendingRestore = useRef(false);
  const resetKey = `${lang}:${more?.dataset ?? ''}`;
  const [seenKey, setSeenKey] = useState(resetKey);
  const loaded = entries.length + extra.length;
  const hasMore = !done && more !== undefined && loaded < more.total;

  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setExtra([]);
    setDone(false);
  }

  useLayoutEffect(() => {
    const mem = scrollMemory.get(window.location.pathname);
    if (mem && Date.now() - mem.ts < RESTORE_WINDOW_MS) {
      savedScroll.current = mem.top;
      pendingRestore.current = mem.top > 0;
    }
    loading.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (!scroller.current?.isConnected)
      scroller.current = scrollParentOf(sentinel.current);
    const el = scroller.current;
    if (!el) return;
    const intent = () => {
      pendingRestore.current = false;
    };
    const onScroll = () => {
      if (pendingRestore.current) return;
      savedScroll.current = el.scrollTop;
      scrollMemory.set(window.location.pathname, {
        top: el.scrollTop,
        ts: Date.now(),
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', intent, { passive: true });
    el.addEventListener('touchmove', intent, { passive: true });
    el.addEventListener('pointerdown', intent, { passive: true });
    window.addEventListener('keydown', intent, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', intent);
      el.removeEventListener('touchmove', intent);
      el.removeEventListener('pointerdown', intent);
      window.removeEventListener('keydown', intent);
    };
  });

  useLayoutEffect(() => {
    if (!scroller.current?.isConnected)
      scroller.current = scrollParentOf(sentinel.current);
    const el = scroller.current;
    if (!el || !pendingRestore.current) return;
    if (el.scrollTop >= savedScroll.current) {
      pendingRestore.current = false;
      return;
    }
    el.scrollTop = savedScroll.current;
    if (el.scrollTop >= savedScroll.current) pendingRestore.current = false;
  }, [entries, extra, lang]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || !more) return;
    let stale = false;
    const observer = new IntersectionObserver(
      ([hit]) => {
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
            if (stale) return;
            if (batch?.length) setExtra((prev) => [...prev, ...batch]);
            if (!batch?.length || batch.length < PAGE_SIZE) setDone(true);
          })
          .catch(() => {
            if (!stale) setDone(true);
          })
          .finally(() => {
            if (!stale) loading.current = false;
          });
      },
      { rootMargin: PREFETCH_MARGIN },
    );
    observer.observe(node);
    return () => {
      stale = true;
      observer.disconnect();
    };
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
