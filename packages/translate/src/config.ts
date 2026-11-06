export type TranslateConfig = {

  locales?: Record<string, unknown> | Record<string, unknown>[];
};

const store = globalThis as Record<symbol, TranslateConfig | undefined>;
const CONFIG_KEY = Symbol.for('terrafirmagreg.config.translate');

export function registerTranslateConfig(next: TranslateConfig): void {
  store[CONFIG_KEY] = { ...store[CONFIG_KEY], ...next };
}

export function translateConfig(): TranslateConfig {
  return store[CONFIG_KEY] ?? {};
}

