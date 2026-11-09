import {
  dynamicLoader,
  llms,
  type DynamicSource,
  type LoaderConfig,
  type LoaderOutput,
} from 'fumadocs-core/source';
import { sectionDatasets } from '@terrafirmagreg-team/kit/lib/datasets';
import { orderPlugin } from '@terrafirmagreg-team/kit/lib/order';
import { renderSectionMarkdown } from '@terrafirmagreg-team/mdx/lib/markdown';
import { localizedDatasetTrees } from '@terrafirmagreg-team/kit/lib/tree';
import type { SectionTrees } from '@terrafirmagreg-team/kit/types';
import type { SectionKey } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export function createSectionSource(options: {
  route: string;

  section: SectionKey;
  source: DynamicSource;

  postTrees?: (trees: SectionTrees) => SectionTrees;
}) {
  const { route, section, source: dynamicSource, postTrees } = options;
  const source: DynamicSource = { ...dynamicSource };
  const loader = dynamicLoader(source, {
    baseUrl: route,
    plugins: [orderPlugin()],
  });
  let resolved: LoaderOutput<LoaderConfig> | undefined;
  const getSource = async () => {
    resolved = (await loader.get()) as unknown as LoaderOutput<LoaderConfig>;
    return resolved;
  };
  const getSourceSync = () => resolved;
  const markdown = {
    page: async (page: unknown) =>
      llms((await getSource()) as never, {
        renderPage: renderSectionMarkdown as (
          page: unknown,
        ) => Promise<string>,
      }).page(page as never),
  };

  const cache = new Map<
    Lang | undefined,
    { source: LoaderOutput<LoaderConfig>; trees: Promise<SectionTrees> }
  >();
  const trees = (lang?: Lang): Promise<SectionTrees> =>
    getSource().then(async (source) => {
      const hit = cache.get(lang);
      if (hit?.source === source) return hit.trees;
      const built = (async () => {
        const result = localizedDatasetTrees(
          source,
          await sectionDatasets(section),
          lang,
        );
        return postTrees ? postTrees(result) : result;
      })();
      cache.set(lang, { source, trees: built });
      return built;
    });

  return { route, getSource, getSourceSync, markdown, trees };
}

