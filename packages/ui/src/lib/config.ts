import type { ComponentType } from 'react';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { PagePreviewData, PreviewIcon } from '@terrafirmagreg-team/ui/types/preview';

export type ExternalMetaProvider = {
  host: RegExp;
  path?: RegExp;
  url: string;
  kind?: 'json' | 'html';
  title?: string;
  description?: string;
  replace?: [RegExp, string][];
};

export const DEFAULT_EXTERNAL_META_PROVIDERS: ExternalMetaProvider[] = [
  {
    host: /(^|\.)wikipedia\.org$/i,
    path: /^\/wiki\/(.+)$/,
    url: 'https://{host}/api/rest_v1/page/summary/{1}',
    kind: 'json',
    title: 'titles.normalized',
    description: 'description',
    replace: [[/_/g, ' ']],
  },
  {
    host: /^github\.com$/i,
    path: /^\/([^/]+)\/([^/?#]+)\/releases\/tag\/([^/?#]+)\/?$/,
    url: 'https://api.github.com/repos/{1}/{2}/releases/tags/{3}',
    kind: 'json',
    title: 'name',
    description: 'body',
  },
  {
    host: /^github\.com$/i,
    path: /^\/([^/]+)\/([^/?#]+)\/(?:issues|pull)\/([^/?#]+)\/?$/,
    url: 'https://api.github.com/repos/{1}/{2}/issues/{3}',
    kind: 'json',
    title: 'title',
    description: 'body',
  },
  {
    host: /^github\.com$/i,
    path: /^\/([^/]+)\/([^/?#]+)\/?$/,
    url: 'https://api.github.com/repos/{1}/{2}',
    kind: 'json',
    title: 'full_name',
    description: 'description',
  },
  {
    host: /^github\.com$/i,
    path: /^\/([^/?#]+)\/?$/,
    url: 'https://api.github.com/users/{1}',
    kind: 'json',
    title: 'name',
    description: 'bio',
  },
  {
    host: /.*/,
    url: 'https://api.microlink.io?url={href}',
    kind: 'json',
    title: 'data.title',
    description: 'data.description',
  },
];

export const DEFAULT_EXTERNAL_FAVICON = 'https://{host}/favicon.ico';

export type UiConfig = {
  basePath?: string;

  brand?: { name: string; icon?: string };

  components?: Record<string, ComponentType<any>>;
  externalMetaProviders?: ExternalMetaProvider[];
  externalFavicon?: string;

  loadPagePreview?: (
    href: string,
    ctx?: { lang?: string },
  ) => Promise<PagePreviewData | undefined>;

  loadPagePreviews?: (
    lang: Lang,
    langMap: Record<string, string>,
    hrefs: Iterable<string>,
  ) => Promise<Record<string, PagePreviewData>>;
  pagePreviewIcon?: ComponentType<{ icon: PreviewIcon }>;
};

const store = globalThis as Record<symbol, unknown>;

export function createConfigRegistry<I extends object, R = I>(
  label: string,
  resolve: (overrides: I) => R = (overrides) => overrides as unknown as R,
) {
  const key = Symbol.for(`terrafirmagreg.config.${label}`);
  store[key] ??= {} as I;
  return {
    register(input: I): void {
      store[key] = { ...(store[key] as I), ...input };
    },
    get(): R {
      return resolve(store[key] as I);
    },
  };
}

const { register: registerUiConfig, get: uiConfig } =
  createConfigRegistry<UiConfig>('ui');

export { registerUiConfig, uiConfig };

