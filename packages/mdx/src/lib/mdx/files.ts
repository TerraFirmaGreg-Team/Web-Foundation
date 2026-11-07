import type {
  FileNode,
  FolderNode,
  ToMdxOptions,
} from 'fumadocs-core/mdx-plugins/remark-mdx-files';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { DirectiveNode } from './directive-utils.ts';
import type { JsxAttribute, JsxElement, MdastNode } from '../../types/mdx';

type TreeNode = FileNode | FolderNode;

const LINK_RE = /^\[([^\]]+)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;

type TreeName = { name: string; href?: string; description?: string };

function parseName(raw: string): TreeName {
  const match = LINK_RE.exec(raw.trim());
  if (!match) return { name: raw };
  const [, text, href, description] = match;
  const out: TreeName = { name: text, href };
  if (description) out.description = description;
  return out;
}

function attributes(parsed: TreeName): JsxAttribute[] {
  const attrs: JsxAttribute[] = [
    { type: 'mdxJsxAttribute', name: 'name', value: parsed.name },
  ];
  if (parsed.href)
    attrs.push({ type: 'mdxJsxAttribute', name: 'href', value: parsed.href });
  if (parsed.description)
    attrs.push({
      type: 'mdxJsxAttribute',
      name: 'description',
      value: parsed.description,
    });
  return attrs;
}

function nodeToMdx(node: TreeNode, options: ToMdxOptions): JsxElement {
  const parsed = parseName(node.name);
  const attrs = attributes(parsed);
  const isFolder = node.type === 'folder' || parsed.name.endsWith('/');
  if (!isFolder)
    return {
      type: 'mdxJsxFlowElement',
      name: 'File',
      attributes: attrs,
      children: [],
    };
  if (options.defaultOpenAll)
    attrs.push({ type: 'mdxJsxAttribute', name: 'defaultOpen', value: true });
  const children =
    node.type === 'folder'
      ? node.children.map((item) => nodeToMdx(item, options) as unknown as MdastNode)
      : [];
  return {
    type: 'mdxJsxFlowElement',
    name: 'Folder',
    attributes: attrs,
    children,
  };
}

export function filesToMdx(node: TreeNode, options: ToMdxOptions): JsxElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'Files',
    attributes: [],
    children:
      node.type === 'folder' && node.name === ''
        ? node.children.map((item) => nodeToMdx(item, options) as unknown as MdastNode)
        : [nodeToMdx(node, options) as unknown as MdastNode],
  };
}

type ListNode = MdastNode & { children?: MdastNode[] };

function itemToTree(item: ListNode): TreeNode {
  const paragraph = item.children?.find((c) => c.type === 'paragraph');
  const nested = item.children?.find((c) => c.type === 'list');
  const link =
    paragraph?.children?.length === 1 &&
    paragraph.children[0].type === 'link'
      ? (paragraph.children[0] as unknown as {
          url: string;
          title?: string | null;
          children: { value: string }[];
        })
      : undefined;
  let name = link ? toString(link.children[0] as never) : toString(paragraph as never);
  const href = link?.url;
  const description = link?.title ?? undefined;
  const annotated = href ? `[${name}](${href}${description ? ` "${description}"` : ''})` : name;
  const isFolder = !!nested || name.endsWith('/');
  if (isFolder) name = name.replace(/\/+$/, '') || name;
  if (!isFolder) return { type: 'file', name: annotated } as FileNode;
  const children = (nested?.children ?? []).map(
    (child) => itemToTree(child as ListNode) as TreeNode,
  );
  return {
    type: 'folder',
    name: href ? `[${name}/](${href}${description ? ` "${description}"` : ''})` : name,
    children,
  } as FolderNode;
}

export function remarkFilesDirective() {
  return (tree: MdastNode) => {
    visit(tree as never, 'containerDirective', (node) => {
      const directive = node as DirectiveNode;
      if (directive.name !== 'files') return;
      const children = (directive.children ?? []).flatMap((child) =>
        child.type === 'list' ? (child.children ?? []) : [],
      );
      if (!children.length) return;
      const root: FolderNode = {
        type: 'folder',
        name: '',
        children: children.map((item) => itemToTree(item as ListNode)),
      } as FolderNode;
      Object.assign(
        directive,
        filesToMdx(root, { defaultOpenAll: true }),
      );
    });
  };
}
