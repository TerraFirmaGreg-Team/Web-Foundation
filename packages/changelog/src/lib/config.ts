import { createConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { ChangelogTimelineEntry } from '../types';

export interface ChangelogDeps {
  loadEntries?: (
    dataset: string,
    lang: Lang,
    offset: number,
    count: number,
  ) => Promise<ChangelogTimelineEntry[]>;
}

export const { register: registerChangelogDeps, get: changelogDeps } =
  createConfig<ChangelogDeps>('Changelog');

export function changelogDepsOrNull(): ChangelogDeps | null {
  try {
    return changelogDeps();
  } catch {
    return null;
  }
}
