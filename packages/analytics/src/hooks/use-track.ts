'use client';
import { useEffect } from 'react';

const KEY = 'tfg:analytics';
const FLUSH_AT = 5;

function pending(): string[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list)
      ? list.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

function flush(apiUrl: string): void {
  const views = pending();
  if (!views.length) return;
  sessionStorage.removeItem(KEY);
  const body = new Blob([JSON.stringify({ views })], {
    type: 'application/json',
  });
  if (navigator.sendBeacon?.(apiUrl, body)) return;
  void fetch(apiUrl, {
    method: 'POST',
    body: JSON.stringify({ views }),
    headers: { 'content-type': 'application/json' },
    keepalive: true,
  }).catch(() => {});
}

export function useTrackView(path: string, apiUrl = '/api/analytics'): void {
  useEffect(() => {
    if (!path) return;
    sessionStorage.setItem(KEY, JSON.stringify([...pending(), path]));
    if (pending().length >= FLUSH_AT) flush(apiUrl);
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush(apiUrl);
    };
    document.addEventListener('visibilitychange', onHidden);
    addEventListener('pagehide', onHidden);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      removeEventListener('pagehide', onHidden);
    };
  }, [path, apiUrl]);
}

