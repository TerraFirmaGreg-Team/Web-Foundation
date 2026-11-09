'use client';

import { useEffect, useRef } from 'react';
import { useFeatureFlags } from '@terrafirmagreg-team/kit/hooks/use-features';
import { queueView } from '@terrafirmagreg-team/analytics/hooks/use-track';

export function TrackRelease({ path }: { path?: string }) {
  const flags = useFeatureFlags();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (flags?.analytics !== true || !path || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          queueView(path);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [flags?.analytics, path]);
  return <span ref={ref} hidden aria-hidden />;
}
