'use client';

import { useState } from 'react';

export function useCalcReset(activeTabId: string | null) {
  const [resetGen, setResetGen] = useState(0);

  const [prevResetTab, setPrevResetTab] = useState(activeTabId);
  if (prevResetTab !== activeTabId) {
    setPrevResetTab(activeTabId);
    setResetGen((gen) => gen + 1);
  }
  return { resetGen, setResetGen };
}

