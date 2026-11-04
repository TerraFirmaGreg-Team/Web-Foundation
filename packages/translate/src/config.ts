export type TranslateConfig = {

  locales?: Record<string, unknown> | Record<string, unknown>[];
};

let config: TranslateConfig = {};

export function registerTranslateConfig(next: TranslateConfig): void {
  config = { ...config, ...next };
}

export function translateConfig(): TranslateConfig {
  return config;
}

