export type DiscussionsDataset = {
  repo?: string;
  discussions?: { repoId: string; categoryId: string };
};

export type DiscussionsConfig = {
  datasets: Record<string, DiscussionsDataset>;
  siteUrl: string;
  knownLanguages: readonly string[];
};

let config: DiscussionsConfig | undefined;

export function registerDiscussionsConfig(
  input: Partial<DiscussionsConfig>,
): void {
  config = { ...config, ...input } as DiscussionsConfig;
}

export function discussionsConfig(): DiscussionsConfig {
  if (!config) {
    throw new Error(
      'Discussions config is not registered: call registerDiscussionsConfig() at app startup.',
    );
  }
  return config;
}
