import type { DatasetSnapshot } from '@terrafirmagreg-team/sites/location';

export type DatasetSnapshotState = Readonly<{
  active?: DatasetSnapshot;
  candidate?: DatasetSnapshot;
  pending: boolean;
  confirming: boolean;
  error?: unknown;
}>;
