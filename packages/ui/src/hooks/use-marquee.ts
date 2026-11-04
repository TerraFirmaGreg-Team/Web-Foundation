'use client';
import { useEffect, useRef, type RefObject } from 'react';

export function useMarquee<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const outer = ref.current;
    const inner = outer?.firstElementChild;
    if (!outer || !(inner instanceof HTMLElement)) return;
    const target =
      outer.closest(
        'a, button, [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="option"]',
      ) ?? outer;

    const measure = () => {
      const overflow = inner.scrollWidth - outer.clientWidth;
      outer.classList.toggle('marquee', overflow > 1);
      if (overflow > 1) {
        inner.style.setProperty('--marquee-x', `${-overflow}px`);
        inner.style.setProperty(
          '--marquee-duration',
          `${Math.max(1.5, overflow / 30)}s`,
        );
      }
    };
    const start = () => {
      measure();
      outer.classList.add('marquee-run');
    };
    const stop = () => outer.classList.remove('marquee-run');

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    target.addEventListener('pointerenter', start);
    target.addEventListener('pointerleave', stop);
    target.addEventListener('focusin', start);
    target.addEventListener('focusout', stop);
    return () => {
      observer.disconnect();
      target.removeEventListener('pointerenter', start);
      target.removeEventListener('pointerleave', stop);
      target.removeEventListener('focusin', start);
      target.removeEventListener('focusout', stop);
    };
  }, []);

  return ref;
}

