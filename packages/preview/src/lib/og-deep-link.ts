import type { DeepLinkResolver } from '@terrafirmagreg-team/kit/types';
import type { SectionKey } from '@terrafirmagreg-team/sites/sections';
import { resolveOgContext } from './og';

export function ogDeepLink(section: SectionKey): DeepLinkResolver {
  return async ({ datasetId, search, lang }) => {
    const ctx = await resolveOgContext(
      section,
      { id: datasetId, version: search.get('version') ?? undefined },
      search,
      lang,
    );
    if (!ctx.entity) return undefined;
    return {
      title: ctx.entity.name,
      ...(ctx.description ? { description: ctx.description } : {}),
      ...(ctx.imageQuery ? { imageQuery: ctx.imageQuery } : {}),
    };
  };
}
