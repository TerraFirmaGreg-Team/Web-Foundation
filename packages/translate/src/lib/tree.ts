import { cloneElement, isValidElement } from 'react';
import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { isLang } from './code';
import { loadLocaleRegistry } from './registry.server';
import { stripLangFromUrl } from './slug';

type LocaleTreeOptions = {
  languages: readonly string[];
  fallbackLanguage: string;
};

function localeTreeOptions(): LocaleTreeOptions {
  const { languages, defaultLanguage } = loadLocaleRegistry();
  return { languages, fallbackLanguage: defaultLanguage };
}

function folderLang(
  node: PageTree.Folder,
  languages: readonly string[],
): Lang | undefined {
  for (const lang of languages) {
    if (typeof node.name === 'string' && node.name === lang) return lang;

    const id = node.$id?.split('/').filter(Boolean).at(-1);
    if (id === lang) return lang;
  }
  return undefined;
}

function rewritePage(
  page: PageTree.Item,
  languages: readonly string[],
): PageTree.Item {
  return { ...page, url: stripLangFromUrl(page.url, languages) };
}

function rewriteNodes(
  nodes: PageTree.Node[],
  languages: readonly string[],
): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type === 'page') return rewritePage(node, languages);
    if (node.type === 'folder') {
      return {
        ...node,
        index: node.index ? rewritePage(node.index, languages) : undefined,
        children: rewriteNodes(node.children, languages),
      };
    }
    return node;
  });
}

function nodeKey(
  node: PageTree.Node,
  languages: readonly string[],
): string | undefined {
  if (node.type === 'page') return stripLangFromUrl(node.url, languages);
  if (node.type === 'folder') {
    if (node.$id) return stripLangFromUrl(`/${node.$id}`, languages);
    if (node.index) return stripLangFromUrl(node.index.url, languages);
    return `folder:${String(node.name)}`;
  }
  return undefined;
}

function mergeWithFallback(
  active: PageTree.Node[],
  fallback: PageTree.Node[],
  languages: readonly string[],
): PageTree.Node[] {
  const out: PageTree.Node[] = active.map((node) => {
    if (node.type !== 'folder') return node;
    const key = nodeKey(node, languages);
    const fb = fallback.find(
      (candidate) =>
        candidate.type === 'folder' && nodeKey(candidate, languages) === key,
    );
    if (!fb || fb.type !== 'folder') return node;
    return {
      ...node,
      children: mergeWithFallback(node.children, fb.children, languages),
    };
  });

  const keys = new Set(
    out
      .map((node) => nodeKey(node, languages))
      .filter((key): key is string => Boolean(key)),
  );

  for (const node of fallback) {
    if (node.type === 'separator') continue;
    const key = nodeKey(node, languages);
    if (!key || keys.has(key)) continue;
    keys.add(key);
    out.push(node);
  }

  return out;
}

function promoteLangFolderChildren(
  folder: PageTree.Folder,
  lang: Lang,
  options: LocaleTreeOptions,
) {
  const children = folder.children.filter(
    (c) => !(c.type === 'page' && /\/index\.mdx?$/.test(c.$id ?? '')),
  );
  return rewriteNodes(promoteLang(children, lang, options), options.languages);
}

function promoteLang(
  nodes: PageTree.Node[],
  lang: Lang,
  options: LocaleTreeOptions,
): PageTree.Node[] {
  const { languages, fallbackLanguage } = options;
  const out: PageTree.Node[] = [];

  for (const node of nodes) {
    if (node.type !== 'folder') {
      if (node.type === 'page') {
        const parts = node.url.split('/').filter(Boolean);
        const locked = isLang(parts[2] ?? '', languages) ? parts[2] : undefined;
        if (locked && locked !== lang) continue;
        out.push(rewritePage(node, languages));
      } else {
        out.push(node);
      }
      continue;
    }

    const langOf = folderLang(node, languages);
    if (langOf) {
      if (langOf !== lang) continue;
      out.push(...promoteLangFolderChildren(node, lang, options));
      continue;
    }

    const activeLangFolder = node.children.find(
      (child): child is PageTree.Folder =>
        child.type === 'folder' && folderLang(child, languages) === lang,
    );
    const fallbackLangFolder =
      lang !== fallbackLanguage
        ? node.children.find(
            (child): child is PageTree.Folder =>
              child.type === 'folder' &&
              folderLang(child, languages) === fallbackLanguage,
          )
        : undefined;

    const rest = node.children.filter((child) => {
      if (child.type !== 'folder') return true;
      return folderLang(child, languages) === undefined;
    });

    let promoted: PageTree.Node[] = [];
    if (activeLangFolder) {
      promoted = promoteLangFolderChildren(activeLangFolder, lang, options);
    }
    if (fallbackLangFolder) {
      const fallbackNodes = promoteLangFolderChildren(
        fallbackLangFolder,
        fallbackLanguage,
        options,
      );
      const stamped = rewriteNodes(fallbackNodes, languages);
      promoted = mergeWithFallback(promoted, stamped, languages);
    }
    promoted.push(...promoteLang(rest, lang, options));

    const indexPage = activeLangFolder?.index
      ? rewritePage(activeLangFolder.index, languages)
      : fallbackLangFolder?.index
        ? rewritePage(fallbackLangFolder.index, languages)
        : node.index
          ? rewritePage(node.index, languages)
          : undefined;

    const indexUrl = indexPage?.url;
    const withoutIndex = promoted.filter(
      (child) => !(child.type === 'page' && indexUrl && child.url === indexUrl),
    );

    out.push({
      ...node,
      index: indexPage,
      children:
        indexPage && node.root ? [indexPage, ...withoutIndex] : withoutIndex,
    });
  }

  return out;
}

function withIconKey<T extends PageTree.Node>(node: T, key: string): T {
  if (node.type === 'separator') return node;
  if (!isValidElement(node.icon) || node.icon.key != null) return node;
  return { ...node, icon: cloneElement(node.icon, { key }) };
}

export function keyTreeNode(node: PageTree.Node): PageTree.Node {
  switch (node.type) {
    case 'page':
      return withIconKey(node, node.url);
    case 'folder':
      return {
        ...withIconKey(node, node.$id ?? node.index?.url ?? String(node.name)),
        index: node.index ? withIconKey(node.index, node.index.url) : node.index,
        children: node.children.map(keyTreeNode),
      };
    case 'separator':
      return node;
    default: {
      const _never: never = node;
      return _never;
    }
  }
}

export function localizePageTree(
  tree: PageTree.Root,
  lang: Lang,
  options?: LocaleTreeOptions,
): PageTree.Root {
  const opts = options ?? localeTreeOptions();
  const children = promoteLang(tree.children, lang, opts);
  const merged =
    lang === opts.fallbackLanguage
      ? children
      : mergeWithFallback(
          children,
          rewriteNodes(
            promoteLang(tree.children, opts.fallbackLanguage, opts),
            opts.languages,
          ),
          opts.languages,
        );
  return {
    ...tree,
    $id: `${tree.$id ?? 'root'}:${lang}`,
    children: merged.map(keyTreeNode),
  };
}

