'use client';

import { createElement } from 'react';
import { lucideIcon } from '@terrafirmagreg-team/ui/lib/utils/icons';
import { EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { PreviewIcon } from '@terrafirmagreg-team/ui/types/preview';

export function PagePreviewIcon({ icon }: { icon: PreviewIcon }) {
  if (icon.type === 'entry') {
    return (
      <EntryIcon
        reference={{ kind: icon.kind as ReferenceKind, id: icon.id }}
        dataset={icon.dataset}
        size={16}
        missing="placeholder"
      />
    );
  }
  const Icon = lucideIcon(icon.name);
  if (!Icon) return null;
  return createElement(Icon, { className: 'size-4 shrink-0' });
}

