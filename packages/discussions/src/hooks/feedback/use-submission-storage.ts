'use client';

import { useEffect, useEffectEvent, useState } from 'react';

export function useSubmissionStorage<Result>(
  key: string,
  validate: (v: unknown) => Result | null,
) {
  const storageKey = `docs-feedback-${key}`;
  const [value, setValue] = useState<Result | null>(null);
  const validateCallback = useEffectEvent(validate);

  useEffect(() => {
    const item = localStorage.getItem(storageKey);
    if (item === null) return;
    const validated = validateCallback(JSON.parse(item));

    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate persisted submission once per key
    if (validated !== null) setValue(validated);
  }, [storageKey]);

  return {
    previous: value,
    setPrevious(result: Result | null) {
      if (result) localStorage.setItem(storageKey, JSON.stringify(result));
      else localStorage.removeItem(storageKey);

      setValue(result);
    },
  };
}

