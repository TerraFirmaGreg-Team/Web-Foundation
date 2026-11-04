'use client';

import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
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
  return (
    <DynamicIcon
      name={icon.name as IconName}
      className="size-4 shrink-0"
    />
  );
}

