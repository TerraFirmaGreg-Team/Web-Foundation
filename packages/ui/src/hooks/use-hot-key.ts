import { useEffect, useEffectEvent } from 'react';

export function useHotKey(
  onKeyDown: (e: KeyboardEvent) => void,
  {
    enabled = true,
    ignoreTyping = false,
  }: {
    enabled?: boolean;

    ignoreTyping?: boolean;
  } = {},
) {
  const listener = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
    if (ignoreTyping && isTypingTarget(e.target)) return;
    onKeyDown(e);
  });

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;

  return target.closest('[role="dialog"]') !== null;
}

