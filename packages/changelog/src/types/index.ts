import type { ReactNode } from 'react';

export interface ChangelogTimelineEntry {
  id: string;
  title: string;
  date: Date;
  url?: string;
  releaseUrl?: string;
  untranslated?: boolean;
  body: ReactNode;
}

export type ChangelogMonth = {
  key: string;
  label: string;
  items: ChangelogTimelineEntry[];
};
