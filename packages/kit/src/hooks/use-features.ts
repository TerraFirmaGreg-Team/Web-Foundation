'use client';
import { useEffect, useState } from 'react';

export type FeatureFlags = {
  analytics: boolean;
  share: boolean;
  feedback: boolean;
  comments: { enabled: boolean; auth: string };
};

let cached: FeatureFlags | undefined;
let pending: Promise<FeatureFlags | undefined> | undefined;

function loadFlags(apiUrl: string): Promise<FeatureFlags | undefined> {
  if (cached) return Promise.resolve(cached);
  pending ??= fetch(apiUrl)
    .then((res) => (res.ok ? res.json() : undefined))
    .then((data: FeatureFlags | undefined) => (cached = data))
    .catch(() => cached)
    .finally(() => {
      pending = undefined;
    });
  return pending;
}

export function useFeatureFlags(
  apiUrl = '/api/features',
): FeatureFlags | undefined {
  const [flags, setFlags] = useState(cached);
  useEffect(() => {
    let cancelled = false;
    void loadFlags(apiUrl).then((data) => {
      if (!cancelled && data !== flags) setFlags(data);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);
  return flags;
}
