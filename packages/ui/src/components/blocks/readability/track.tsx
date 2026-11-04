'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useReadability } from '@terrafirmagreg-team/ui/hooks/readability/use-readability';
import { readabilityConfig } from '@terrafirmagreg-team/ui/lib/readability/config';
import {
  contentRoot,
  resolveSpotlight,
  rowBand,
} from '@terrafirmagreg-team/ui/lib/readability/spotlight';
import type { SpotlightStyle } from '@terrafirmagreg-team/ui/types/readability';

function SpotlightBox({
  enabled,
  style,
}: {
  enabled: boolean;
  style: SpotlightStyle;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const mouse = useRef({ x: 0, y: 0 });
  const highlighted = useRef<HTMLElement | undefined>(undefined);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || !enabled) {
      if (box) box.style.display = 'none';
      return;
    }
    const root = contentRoot();
    if (!root) return;

    box.style.display = 'none';
    highlighted.current = undefined;

    const hide = () => {
      box.style.display = 'none';
    };

    const place = (
      top: number,
      left: number,
      width: number,
      height: number,
    ) => {
      box.style.display = 'block';
      box.style.top = `${top - 4}px`;
      box.style.left = `${left - 4}px`;
      box.style.width = `${width + 8}px`;
      box.style.height = `${height + 8}px`;
    };

    const watchVisibility = (el: HTMLElement | undefined) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!el) return;
      observer.current = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) hide();
      });
      observer.current.observe(el);
    };

    const placeForElement = (el: HTMLElement) => {
      const { y } = mouse.current;
      if (el.tagName === 'P') {
        const lineHeight = Number.parseFloat(
          window.getComputedStyle(el).lineHeight,
        );
        const lines = Math.floor(el.offsetHeight / lineHeight);
        if (Number.isFinite(lineHeight) && lineHeight > 0 && lines > 0) {
          const rect = el.getBoundingClientRect();
          const relativeY = y - rect.top;
          for (let i = 0; i < lines; i++) {
            const top = i * lineHeight;
            if (relativeY >= top && relativeY < top + lineHeight) {
              place(rect.top + top, rect.left, el.offsetWidth, lineHeight);
              return;
            }
          }
          return;
        }
      }

      const rect = rowBand(el, root, style) ?? el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        hide();
        return;
      }
      place(rect.top, rect.left, rect.width, rect.height);
    };

    const page = document.getElementById('page') ?? root;
    const update = () => {
      const { x, y } = mouse.current;
      const bounds = page.getBoundingClientRect();
      if (
        x < bounds.left ||
        x > bounds.right ||
        y < bounds.top ||
        y > bounds.bottom
      ) {
        hide();
        return;
      }
      const point = document.elementFromPoint(x, y);
      const target =
        point instanceof HTMLElement ? point : point?.parentElement;
      const el =
        target &&
        target !== root &&
        root.contains(target) &&
        !target.closest('nav') &&
        !target.closest('#toc')
          ? resolveSpotlight(target, root, style)
          : null;
      if (el !== highlighted.current) {
        highlighted.current = el ?? undefined;
        watchVisibility(el ?? undefined);
      }
      if (el) placeForElement(el);
      else hide();
    };

    const onMove = (event: MouseEvent) => {
      mouse.current = { x: event.clientX, y: event.clientY };
      update();
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      observer.current?.disconnect();
    };
  }, [enabled, pathname, style]);

  if (!enabled) return null;

  return (
    <div
      ref={boxRef}
      aria-hidden
      data-spotlight-style={style}
      className="pointer-events-none fixed z-20 rounded-lg transition-all duration-200 data-[spotlight-style=under]:bg-(--spotlight-under-bg-color) before:absolute before:inset-y-0 before:-start-4 before:w-1 before:rounded-full before:bg-primary before:content-[''] data-[spotlight-style=under]:before:hidden"
      style={{ display: 'none' }}
    />
  );
}

export function SpotlightTrack() {
  const { spotlight, spotlightStyle, coarsePointer } = useReadability();
  const pathname = usePathname();
  const disabled = readabilityConfig().isSpotlightDisabled?.(pathname) ?? false;
  return (
    <SpotlightBox
      enabled={spotlight && !coarsePointer && !disabled}
      style={spotlightStyle}
    />
  );
}

