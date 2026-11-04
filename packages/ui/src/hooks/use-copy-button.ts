'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopyButton(onCopy: () => unknown): {
  checked: boolean;
  isLoading: boolean;
  error: boolean;
  onClick: () => void;
} {
  const [isLoading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState(false);
  const callbackRef = useRef(onCopy);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = onCopy;
  });

  const onClick = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setChecked(false);
    setError(false);
    setLoading(true);
    Promise.resolve()
      .then(() => callbackRef.current())
      .then(() => {
        setChecked(true);
        timeoutRef.current = window.setTimeout(() => setChecked(false), 1500);
      })
      .catch((err: unknown) => {
        console.error('Failed to copy:', err);
        setError(true);
        timeoutRef.current = window.setTimeout(() => setError(false), 1500);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return { checked, isLoading, error, onClick };
}

