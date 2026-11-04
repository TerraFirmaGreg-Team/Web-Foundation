'use client';

import { useEffect, useState } from 'react';

export type ModifierKeys = {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
};

const IDLE: ModifierKeys = { shift: false, ctrl: false, alt: false };

export function useModifierKeys(active = true): ModifierKeys {
  const [keys, setKeys] = useState<ModifierKeys>(IDLE);
  useEffect(() => {
    if (!active) return;
    const update = (e: KeyboardEvent) => {
      setKeys({ shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey });
    };
    const reset = () => setKeys(IDLE);
    window.addEventListener('keydown', update);
    window.addEventListener('keyup', update);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', update);
      window.removeEventListener('keyup', update);
      window.removeEventListener('blur', reset);
    };
  }, [active]);
  return keys;
}

