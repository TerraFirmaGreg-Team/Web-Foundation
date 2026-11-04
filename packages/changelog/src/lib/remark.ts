type MdNode = {
  type: string;
  depth?: number;
  children?: { type?: string; value?: string; children?: unknown[] }[];
};

const STRIP_HEADING = /^(what'?s changed|new contributors)$/i;
const FULL_CHANGELOG = /^\*?\*?full changelog\*?\*?/i;

const text = (node: MdNode): string =>
  (node.children ?? [])
    .map((child) => child.value ?? text(child as MdNode))
    .join('')
    .trim();

export const remarkStripAutoSections =
  () =>
  (tree: { children: MdNode[] }) => {
    const out: MdNode[] = [];
    let skipDepth = 0;
    for (const node of tree.children) {
      if (node.type === 'heading') {
        const depth = node.depth ?? 2;
        if (STRIP_HEADING.test(text(node))) {
          skipDepth = depth;
          continue;
        }
        if (skipDepth && depth <= skipDepth) skipDepth = 0;
        if (skipDepth) continue;
      } else if (skipDepth) {
        continue;
      }
      if (node.type === 'paragraph' && FULL_CHANGELOG.test(text(node)))
        continue;
      out.push(node);
    }
    tree.children = out;
  };
