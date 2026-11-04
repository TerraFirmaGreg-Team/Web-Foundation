'use client';
import { useMemo } from 'react';
import { useTranslations as useFumaTranslations } from '@terrafirmagreg-team/translate/runtime';

export function useTranslations<K extends string = string>(options?: {
  note?: string;
}) {
  const base = useFumaTranslations(options);
  return useMemo(
    () =>
      ((key: K, opts?: {
        note?: string;
        variables?: Record<string, string>;
      }) => {
        const value = base(key, opts);
        return opts?.note && value === key ? base(key) : value;
      }) as (key: K, opts?: {
        note?: string;
        variables?: Record<string, string>;
      }) => string,
    [base],
  );
}

