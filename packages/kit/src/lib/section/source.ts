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

  let cached:
    | { source: LoaderOutput<LoaderConfig>; trees: Promise<SectionTrees> }
    | undefined;
  const trees = (): Promise<SectionTrees> =>
    getSource().then((source) => {
      if (cached?.source === source) return cached.trees;
      const built = (async () => {
        const result = localizedDatasetTrees(
          source,
          await sectionDatasets(section),
        );
        return postTrees ? postTrees(result) : result;
      })();
      cached = { source, trees: built };
      return built;
    });

  return { route, getSource, getSourceSync, markdown, trees };
}

