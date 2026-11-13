export interface PublishedSnapshot {
  revision: string;
  publishedAt: string;
  index: string;
}

export interface DatasetVersions {
  pack: string;
  latest: string | null;
  versions: string[];
  snapshots: Record<string, PublishedSnapshot>;
}

export interface ArtifactDescriptor {
  sha256: string;
  bytes: number;
  codec: 'json' | 'ndjson' | 'binary';
  compression: 'gzip' | 'none';
}

export interface SnapshotIndex {
  files: Record<string, string>;
  artifacts: Record<string, ArtifactDescriptor>;
}
