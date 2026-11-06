export type DiscussionsDataset = {
  repo?: string;
  discussions?: { repoId: string; categoryId: string };
};

export type DiscussionsConfig = {
  datasets: Record<string, DiscussionsDataset>;
  siteUrl: string;
  knownLanguages: readonly string[];
};

const store = globalThis as Record<symbol, DiscussionsConfig | undefined>;
const CONFIG_KEY = Symbol.for('terrafirmagreg.config.discussions');

export function registerDiscussionsConfig(
  input: Partial<DiscussionsConfig>,
): void {
  store[CONFIG_KEY] = { ...store[CONFIG_KEY], ...input } as DiscussionsConfig;
}

export function discussionsConfig(): DiscussionsConfig {
  const config = store[CONFIG_KEY];
  if (!config) {
    throw new Error(
      'Discussions config is not registered: call registerDiscussionsConfig() at app startup.',
    );
  }
  return config;
}
