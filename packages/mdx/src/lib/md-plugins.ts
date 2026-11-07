import { rehypeCode } from 'fumadocs-core/mdx-plugins/rehype-code';
import {
  rehypeCodeDefaultOptions,
  remarkMdxFiles,
  remarkMdxMermaid,
  remarkSteps,
} from 'fumadocs-core/mdx-plugins';
import { remarkBlockId } from 'fumadocs-core/mdx-plugins/remark-block-id';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { fileGenerator, remarkDocGen, remarkShow } from 'fumadocs-docgen';
import { remarkAutoTypeTable } from 'fumadocs-typescript';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { remarkAccordions } from './mdx/accordions';
import { remarkBanner } from './mdx/banner';
import { remarkCallouts } from './mdx/callouts';
import { remarkDirectiveFallback } from './mdx/directive-fallback';
import { remarkDirectives } from './mdx/directives';
import { filesToMdx, remarkFilesDirective } from './mdx/files';
import { remarkEntries } from './mdx/entries/index.ts';
import { remarkGithubAutolinks } from './mdx/github-autolinks';
import { remarkPreview } from './mdx/preview';
import { remarkTabs } from './mdx/tabs';
import type { PluggableList } from 'unified';

const rehypeCodeOptions = {
  ...rehypeCodeDefaultOptions,
  inline: 'tailing-curly-colon' as const,
  transformers: [
    ...(rehypeCodeDefaultOptions.transformers ?? []),
    transformerTwoslash(),
    {
      name: 'code-lang-title',
      pre(this: { options?: { lang?: string } }, node: {
        properties?: Record<string, unknown>;
      }) {
        node.properties ??= {};
        node.properties.title ??= this.options?.lang;
      },
    },
  ],
  langs: [
    ...(rehypeCodeDefaultOptions.langs ?? []),
    'java',
    'json',
    'yaml',
    'bash',
    'md',
    'toml',
    'diff',
  ],
};

export const mdOptions = (
  datasetConfig: Record<string, { repo?: string }> = {},
) => ({
  mdOptions: {
    remarkImageOptions: { onError: 'ignore' },
    remarkPlugins: [
      remarkDirective,
      remarkPreview,
      remarkTabs,
      remarkAccordions,
      remarkBanner,
      remarkDirectives,
      remarkEntries,
      [remarkGithubAutolinks, { datasetConfig }],
      [remarkDocGen, { generators: [fileGenerator()] }],
      remarkShow,
      remarkAutoTypeTable,
      remarkCallouts,
      remarkMath,
      remarkSteps,
      [remarkMdxFiles, { toMdx: filesToMdx }],
      remarkFilesDirective,
      remarkMdxMermaid,
      remarkDirectiveFallback,
      [remarkBlockId, { addDataAttribute: 'feedback' }],
    ] as PluggableList,
    remarkRehypeOptions: { allowDangerousHtml: true },
    rehypeCodeOptions: false,
    rehypePlugins: [
      rehypeKatex,
      [rehypeCode, rehypeCodeOptions],
      [
        rehypeRaw,
        {
          passThrough: [
            'mdxjsEsm',
            'mdxJsxFlowElement',
            'mdxJsxTextElement',
            'mdxFlowExpression',
            'mdxTextExpression',
          ],
        },
      ],
    ] as PluggableList,
  } as const,
});

