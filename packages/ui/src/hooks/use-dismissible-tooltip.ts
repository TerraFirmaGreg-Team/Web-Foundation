'use client';

import { useEffect, useState } from 'react';
import { onTooltipDismiss } from '@terrafirmagreg-team/ui/lib/dismiss-tooltips';

export function useDismissibleTooltip() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    return onTooltipDismiss(() => setOpen(false));
  }, [open]);
  return [open, setOpen] as const;
}
