'use client';

import { useReactFlow } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { Search } from 'lucide-react';
import {
  ViewerToolbar,
  ViewerControls,
} from '@terrafirmagreg-team/ui/components/blocks/viewer/controls';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import type { FlowToolbarProps } from '@terrafirmagreg-team/ui/types/canvas';

export function FlowToolbar({ onFit, search }: FlowToolbarProps) {
  const { zoomIn, zoomOut } = useReactFlow();
  return (
    <ViewerToolbar>
      <ViewerControls
        start={
          search ? (
            <IconButton overlay label={search.label} onClick={search.onOpen}>
              <Search className="size-3.5" />
            </IconButton>
          ) : null
        }
        zoom={{
          onZoomIn: () => void zoomIn({ duration: 150 }),
          onZoomOut: () => void zoomOut({ duration: 150 }),
          onFit,
        }}
      />
    </ViewerToolbar>
  );
}

