'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UntranslatedChip } from '@terrafirmagreg-team/ui/components/blocks/lang/untranslated-chip';
import {
  FloatBar,
  FloatBarItem,
} from '@terrafirmagreg-team/ui/components/blocks/viewer/float-bar';

export type ChangelogNowItem = {
  id: string;
  untranslated?: boolean;
};

export function ChangelogNow({ items }: { items: ChangelogNowItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(items[0]?.id ?? null);

  useEffect(() => {
    const bar = ref.current;
    const root = bar?.closest('[data-changelog-timeline]');
    if (!bar || !root) return;

    let tops: { id: string; top: number }[] = [];
    const measure = () => {
      const base = root.getBoundingClientRect().top;
      tops = [...root.querySelectorAll<HTMLElement>('[data-release]')].map(
        (li) => ({
          id: li.id,
          top: li.getBoundingClientRect().top - base,
        }),
      );
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const y =
        bar.getBoundingClientRect().top - root.getBoundingClientRect().top;
      let active = tops[0]?.id ?? null;
      for (const { id, top } of tops) {
        if (top <= y) active = id;
        else break;
      }
      setActiveId((prev) => (prev === active ? prev : active));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      schedule();
    };
    measure();
    update();
    document.addEventListener('scroll', schedule, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', remeasure);
    const observer = new ResizeObserver(remeasure);
    observer.observe(root);
    return () => {
      document.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', remeasure);
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const current = useMemo(
    () => items.find((entry) => entry.id === activeId) ?? null,
    [items, activeId],
  );

  return (
    <div
      ref={ref}
      className="not-prose pointer-events-none sticky top-[calc(var(--header-height,0px)+0.75rem)] z-10 h-0"
    >
      {current && (
        <div className="absolute start-[7px] flex -translate-y-1/2 items-center gap-2">
          <span className="size-3 shrink-0 rounded-full border-2 border-primary bg-background" />
          <FloatBar className="pointer-events-auto">
            <FloatBarItem className="gap-1.5">
              <span className="font-semibold">{current.id}</span>
              <span className={current.untranslated ? undefined : 'hidden'}>
                <UntranslatedChip />
              </span>
            </FloatBarItem>
          </FloatBar>
        </div>
      )}
    </div>
  );
}
