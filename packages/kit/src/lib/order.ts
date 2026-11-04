import type {
  LoaderPlugin,
  PageTreeBuilderContext,
} from 'fumadocs-core/source';
import type { Folder, Item, Node } from 'fumadocs-core/page-tree';

type Storage = PageTreeBuilderContext['storage'];
type NodeLike = Item | Folder;

type PageFrontmatter = {
  order?: number;
  unlisted?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  link?: boolean;
};

function frontmatter(
  storage: Storage,
  filePath?: string,
): PageFrontmatter | undefined {
  if (!filePath) return undefined;
  const file = storage.read(filePath);
  return file?.format === 'page' ? (file.data as PageFrontmatter) : undefined;
}

function orderOf(storage: Storage, node: NodeLike): number {
  const ref =
    node.type === 'page'
      ? node.$ref
      : (node.index?.$ref ??
        (node as Folder & { $indexRef?: string }).$indexRef);
  const data = frontmatter(storage, ref);
  return typeof data?.order === 'number' ? data.order : Number.MAX_SAFE_INTEGER;
}

function isUnlisted(storage: Storage, node: NodeLike): boolean {
  const data = frontmatter(
    storage,
    node.type === 'page' ? node.$ref : node.index?.$ref,
  );
  return data?.unlisted === true;
}

function hasExplicitOrder(storage: Storage, metaPath?: string): boolean {
  if (!metaPath) return false;
  const file = storage.read(metaPath);
  return (
    file?.format === 'meta' &&
    Array.isArray((file.data as { pages?: unknown }).pages)
  );
}

function arrange(storage: Storage, children: Node[], metaPath?: string): Node[] {
  const kept = children.filter(
    (child) => child.type === 'separator' || !isUnlisted(storage, child),
  );
  if (hasExplicitOrder(storage, metaPath)) return kept;
  return [...kept].sort(
    (a, b) => orderOf(storage, a as NodeLike) - orderOf(storage, b as NodeLike),
  );
}

export function orderPlugin(): LoaderPlugin {
  return {
    name: 'wiki:order',
    transformPageTree: {
      folder(node, _folderPath, metaPath) {
        const indexRef = node.index?.$ref;
        const index = frontmatter(this.storage, indexRef);
        const next: Folder = {
          ...node,
          defaultOpen: index?.defaultOpen ?? node.defaultOpen,
          collapsible: index?.collapsible ?? node.collapsible,
          children: arrange(this.storage, node.children, metaPath),
        };
        if (index?.link === false && indexRef) {
          delete next.index;
          (next as Folder & { $indexRef?: string }).$indexRef = indexRef;
        }
        return next;
      },
      root(node) {
        return { ...node, children: arrange(this.storage, node.children) };
      },
    },
  };
}

