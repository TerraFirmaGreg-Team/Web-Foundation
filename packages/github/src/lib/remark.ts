import path from 'node:path';
import { realpathSync } from 'node:fs';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import { valueToEstree } from 'estree-util-value-to-estree';
import { visit } from 'unist-util-visit';
import {
  shouldShowChangelog,
  shouldShowContributors,
} from 'fumadocs-page-history';
import {
  createHistoryReader,
  resolveAuthors,
} from 'fumadocs-page-history/git';
import { resolveAuthorMappings } from './authors.ts';
import type { GitChangelogProps } from 'fumadocs-page-history/ui';
import { compactTags } from './tags.ts';
import type { HistoryLoaderOptions } from './history.ts';
import {
  PAGE_HISTORY_EXPORT,
  type PageHistoryData,
} from '../types/history.ts';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';

export interface GitChangelogOptions extends HistoryLoaderOptions {
  content?: ContentLocation;
  filter?: (filePath: string) => boolean;
  contributorsFilter?: (filePath: string) => boolean;
  display?: Omit<GitChangelogProps, 'commits' | 'authors' | 'repository'>;
}

type MdastNode = {
  type: string;
  children?: MdastNode[];
  data?: { hProperties?: { id?: string } };
  attributes?: { name?: string; value?: unknown }[];
  value?: string;
};

function normalizeRepositoryPath(
  value: string,
  allowRoot = false,
): string {
  const normalized = path.posix.normalize(value);
  if (
    path.posix.isAbsolute(value) ||
    /^[a-z]:[/\\]/i.test(value) ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    (!allowRoot && (normalized === '.' || !value))
  )
    throw new Error(
      'History requires a non-empty repository-relative file path inside the checkout.',
    );
  return normalized;
}

function mapContentPath(
  file: string,
  directory: string,
  pathInRepository = '.',
): string {
  const relative = path.relative(directory, file);
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`)
  )
    throw new Error('The document must be inside content.directory.');
  const prefix = normalizeRepositoryPath(pathInRepository, true);
  return normalizeRepositoryPath(
    path.posix.join(prefix, relative.split(path.sep).join('/')),
  );
}

export interface ContentLocation {
  directory: string;
  pathInRepository: string;
}

function resolveContentPath(
  file: string,
  root: string,
  content?: ContentLocation,
): string {
  return mapContentPath(
    path.join(realpathSync(path.dirname(file)), path.basename(file)),
    content ? realpathSync(path.resolve(content.directory)) : root,
    content?.pathInRepository,
  );
}

function collectIds(tree: MdastNode): Set<string> {
  const ids = new Set<string>();
  const slugger = new GithubSlugger();
  visit(tree as unknown as Root, (node) => {
    const n = node as MdastNode;
    const id = n.data?.hProperties?.id;
    if (typeof id === 'string') ids.add(id);
    else if (n.type === 'heading') {
      const text = toString(node as never);
      ids.add(
        /\[#([^\]\s]+)\]\s*$/.exec(text)?.[1] ?? slugger.slug(text.trim()),
      );
    }
    if (
      n.type === 'mdxJsxFlowElement' ||
      n.type === 'mdxJsxTextElement'
    ) {
      for (const attribute of n.attributes ?? [])
        if (
          attribute.name === 'id' &&
          typeof attribute.value === 'string'
        )
          ids.add(attribute.value);
    } else if (n.type === 'html') {
      for (const [, value] of (n.value ?? '').matchAll(
        /\bid\s*=\s*["']([^"']+)["']/g,
      ))
        ids.add(value);
    }
  });
  return ids;
}

type RemarkFile = { path?: string; data?: { frontmatter?: Record<string, unknown> } };

export const remarkGitChangelog: Plugin<[GitChangelogOptions], Root> = (
  options,
) => {
  let reader: ReturnType<typeof createHistoryReader> | undefined;
  let authorMappings = options.authorMappings ?? [];
  const reported = new Set<string>();
  return async (tree, file) => {
    const filePath = (file as RemarkFile | undefined)?.path;
    if (!filePath)
      throw new Error('Git changelog requires a source file path.');
    const absolutePath = path.resolve(filePath);
    if (options.filter && !options.filter(absolutePath)) return;
    const frontmatter =
      (file as RemarkFile | undefined)?.data?.frontmatter ?? {};
    const showChangelog = shouldShowChangelog(frontmatter);
    const showContributors =
      shouldShowContributors(frontmatter) &&
      options.display?.showContributors !== false &&
      (options.contributorsFilter
        ? options.contributorsFilter(absolutePath)
        : true);
    if (!showChangelog && !showContributors) return;
    if (!reader) {
      const directory =
        options.repository.directory ?? path.dirname(absolutePath);
      authorMappings = [
        ...authorMappings,
        ...(await resolveAuthorMappings({
          repository: options.repository.url,
          directory,
          exclude: options.authorMappings,
        })),
      ];
      reader = createHistoryReader({
        ...options,
        authorMappings,
        repository: { ...options.repository, directory },
      });
    }
    const root = await reader.getRoot();
    const gitPath = resolveContentPath(
      absolutePath,
      root,
      options.content,
    );
    const commits = await reader.read(gitPath);
    for (const commit of commits)
      commit.tags = compactTags(commit.tags, options.repository.url);
    const authors = resolveAuthors(
      (frontmatter.authors as string[] | undefined) ?? [],
      authorMappings,
    );
    if (!commits.length && !authors.length) {
      if (
        process.env.NODE_ENV === 'development' &&
        !reported.has(absolutePath)
      ) {
        reported.add(absolutePath);
        console.info(
          `[page-history] No Git history for ${gitPath}; skipping the footer.`,
        );
      }
      return;
    }
    const source = JSON.stringify(tree);
    const component = showChangelog ? 'GitChangelog' : 'GitContributors';
    let labelName = '_FumadocsGitChangelogLabel';
    while (source.includes(labelName)) labelName += '_';
    const takenIds = collectIds(tree as MdastNode);
    const uniqueId = (base: string) => {
      let id = base;
      while (takenIds.has(id)) id += '-1';
      return id;
    };
    const historyId = options.display?.id ?? uniqueId('git-history');
    const contributorsId =
      (showChangelog
        ? options.display?.contributorsId
        : options.display?.id) ?? uniqueId('git-contributors');
    const headings: MdastNode[] = [];
    const addHeading = (section: string, id: string) => {
      headings.push({
        type: 'heading',
        depth: 2,
        data: {
          hProperties: { id },
        },
        children: [
          {
            type: 'mdxJsxTextElement',
            name: labelName,
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'section',
                value: section,
              },
            ],
            children: [],
          } as unknown as MdastNode,
          { type: 'text', value: '[toc]' } as MdastNode,
        ],
      } as unknown as MdastNode);
    };
    if (showContributors && !options.display?.hideContributorsHeader)
      addHeading('contributors', contributorsId);
    if (showChangelog && !options.display?.hideChangelogHeader)
      addHeading('history', historyId);
    const props = showChangelog
      ? {
          ...options.display,
          commits,
          authors,
          repository: { url: options.repository.url },
          showContributors,
          id: historyId,
          contributorsId,
        }
      : {
          commits,
          authors,
          locale: options.display?.locale,
          hideContributorsHeader: options.display?.hideContributorsHeader,
          id: contributorsId,
          className: options.display?.className,
        };
    const payload: PageHistoryData = {
      component,
      props,
    } as PageHistoryData;
    const moduleName = 'fumadocs-page-history/ui';
    tree.children.unshift(
      {
        type: 'mdxjsEsm',
        value: `import { GitChangelogLabel as ${labelName} } from '${moduleName}';`,
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ImportDeclaration',
                attributes: [],
                source: { type: 'Literal', value: moduleName },
                specifiers: [
                  {
                    type: 'ImportSpecifier',
                    imported: {
                      type: 'Identifier',
                      name: 'GitChangelogLabel',
                    },
                    local: { type: 'Identifier', name: labelName },
                  },
                ],
              },
            ],
          },
        },
      } as unknown as (typeof tree.children)[number],
      {
        type: 'mdxjsEsm',
        value: `export const ${PAGE_HISTORY_EXPORT} = ${JSON.stringify(payload)};`,
        data: {
          estree: {
            type: 'Program',
            sourceType: 'module',
            body: [
              {
                type: 'ExportNamedDeclaration',
                specifiers: [],
                source: null,
                attributes: [],
                declaration: {
                  type: 'VariableDeclaration',
                  kind: 'const',
                  declarations: [
                    {
                      type: 'VariableDeclarator',
                      id: {
                        type: 'Identifier',
                        name: PAGE_HISTORY_EXPORT,
                      },
                      init: valueToEstree(payload),
                    },
                  ],
                },
              },
            ],
          },
        },
      } as unknown as (typeof tree.children)[number],
    );
    tree.children.push(...(headings as typeof tree.children));
  };
};
