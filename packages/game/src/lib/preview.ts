import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import {
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { PreviewIcon } from '@terrafirmagreg-team/ui/types/preview';

export function entryPreviewIcon(
  ref: TaggedReference | undefined,
  dataset: DatasetRef,
): PreviewIcon | undefined {
  if (!ref) return undefined;
  return {
    type: 'entry',
    kind: ref.kind,
    id: stackIdFromRef(ref),
    dataset,
  };
}

