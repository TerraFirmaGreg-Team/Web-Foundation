'use client';
import { useCallback, type RefCallback } from 'react';

export function useHoverFollow(): RefCallback<HTMLElement> {
  return useCallback<RefCallback<HTMLElement>>((area) => {
    const block = area?.firstElementChild;
    if (!area || !(block instanceof HTMLElement)) return;
    let current: Element | null = null;
    const show = (item: Element | null) => {
      if (item === current) return;
      block.style.transitionProperty = current ? '' : 'opacity';
      current = item;
      if (!item) {
        block.style.opacity = '0';
        return;
      }
      const rect = item.getBoundingClientRect();
      const origin = area.getBoundingClientRect();
      block.style.translate = `${rect.left - origin.left}px ${rect.top - origin.top}px`;
      block.style.width = `${rect.width}px`;
      block.style.height = `${rect.height}px`;
      block.style.opacity = item.matches('[data-active=true]') ? '0' : '1';
    };
    const itemOf = (target: unknown) =>
      target instanceof Element ? target.closest('a[href], button') : null;
    const controller = new AbortController();
    const { signal } = controller;
    area.addEventListener(
      'pointerover',
      (e) => {
        const item = itemOf(e.target);
        if (item && e.pointerType === 'mouse') show(item);
      },
      { signal },
    );
    area.addEventListener('pointerleave', () => show(null), { signal });
    area.addEventListener(
      'focusin',
      (e) => {
        if (e.target instanceof Element && e.target.matches(':focus-visible'))
          show(itemOf(e.target));
      },
      { signal },
    );
    area.addEventListener(
      'focusout',
      () => {
        if (!area.matches(':hover')) show(null);
      },
      { signal },
    );
    return () => controller.abort();
  }, []);
}

