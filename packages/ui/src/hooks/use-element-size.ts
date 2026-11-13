'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const observed = useRef<{ el: Element; ro: ResizeObserver } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || observed.current?.el === el) return;
    observed.current?.ro.disconnect();
    const apply = (width: number, height: number) =>
      setSize((prev) =>
        prev.w === width && prev.h === height ? prev : { w: width, h: height },
      );
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) apply(rect.width, rect.height);
    });
    ro.observe(el);
    observed.current = { el, ro };
    apply(el.clientWidth, el.clientHeight);
  });

  useEffect(
    () => () => {
      observed.current?.ro.disconnect();
      observed.current = null;
    },
    [],
  );

  return size;
}

