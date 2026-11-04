import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export interface MarkdownProviderCtx {

  slugs: string[];
  lang: Lang;
}

export type MarkdownProvider = (
  req: Request,
  ctx: MarkdownProviderCtx,
) => Promise<Response | undefined>;

const providers = new Map<string, MarkdownProvider>();

export function registerMarkdownProvider(
  section: string,
  provider: MarkdownProvider,
): void {
  providers.set(section, provider);
}

export function markdownProvider(section: string): MarkdownProvider | undefined {
  return providers.get(section);
}

