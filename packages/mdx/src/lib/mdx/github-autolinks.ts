type MdastNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MdastNode[];
  data?: { hProperties?: Record<string, unknown> };
};

const ISSUE_REF = /^#\d+$/;
const USER_REF = /^@[a-zA-Z\d](?:[a-zA-Z\d-]{0,37}[a-zA-Z\d])?$/;
const AUTO_REF = /(\B#\d+\b|\B@[a-zA-Z\d](?:[a-zA-Z\d-]{0,37}[a-zA-Z\d])?)/g;
const SKIP = new Set([
  'link',
  'linkReference',
  'image',
  'imageReference',
  'code',
  'inlineCode',
  'html',
]);

const DEFAULT_PATHS = [
  /[/\\]changelog[/\\]([^/\\]+)[/\\]/,
  /[/\\]docs[/\\]([^/\\]+)[/\\][^/\\]+[/\\]major-changelogs[/\\]/,
];

export function remarkGithubAutolinks(options: {
  datasetConfig?: Record<string, { repo?: string }>;
  paths?: RegExp[];
} = {}) {
  const { datasetConfig = {}, paths = DEFAULT_PATHS } = options;
  return (tree: MdastNode, file: { path?: string }) => {
    const filePath = file.path ?? '';
    const pack = paths
      .map((pattern) => pattern.exec(filePath)?.[1])
      .find(Boolean);
    const repo = pack ? datasetConfig[pack]?.repo : undefined;
    if (!repo) return;
    const repoUrl = `https://github.com/${repo}`;
    const visit = (node: MdastNode) => {
      if (SKIP.has(node.type) || !node.children) return;
      node.children = node.children.flatMap((child): MdastNode[] => {
        if (child.type !== 'text') {
          visit(child);
          return [child];
        }
        return (child.value ?? '').split(AUTO_REF).map((part) =>
          ISSUE_REF.test(part)
            ? {
                type: 'link',
                url: `${repoUrl}/issues/${part.slice(1)}`,
                children: [{ type: 'text', value: part }],
                data: { hProperties: { className: 'gh-issue' } },
              }
            : USER_REF.test(part)
              ? {
                  type: 'link',
                  url: `https://github.com/${part.slice(1)}`,
                  children: [{ type: 'text', value: part }],
                  data: { hProperties: { className: 'gh-mention' } },
                }
              : { type: 'text', value: part },
        );
      });
    };
    visit(tree);
  };
}
