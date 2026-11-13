import GithubSlugger from 'github-slugger';
import { remarkDirectives } from './directives.ts';
import {
  remarkCodeTab,
  remarkHeading,
  remarkImage,
  remarkMdxFiles,
  remarkMdxMermaid,
  remarkNpm,
  remarkSteps,
} from 'fumadocs-core/mdx-plugins';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import {
  contentChildren,
  extractDirectiveLabel,
  jsxAttr,
  type DirectiveNode,
  type JsxElement,
  type MdastNode,
} from './directive-utils.ts';

type VFileLike = {
  path?: string;
  cwd?: string;
  value?: unknown;
};

type Positioned = {
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
};

const previewSeq = new WeakMap<object, number>();

function nextPreviewId(file: VFileLike): number {
  const key = file as object;
  const n = (previewSeq.get(key) ?? 0) + 1;
  previewSeq.set(key, n);
  return n;
}


function walk(node: MdastNode, visit: (n: MdastNode) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function markHeadingNoToc(heading: MdastNode): void {
  const kids = heading.children ?? [];
  const last = kids[kids.length - 1];
  if (last?.type === 'text' && typeof last.value === 'string') {
    if (!last.value.includes('[!toc]')) {
      last.value = `${last.value.replace(/\s+$/, '')} [!toc]`;
    }
    return;
  }
  kids.push({ type: 'text', value: ' [!toc]' });
  heading.children = kids;
}

function uniquifyHeadingIds(tree: MdastNode): void {
  const used = new Set<string>();
  walk(tree, (node) => {
    if (node.type !== 'heading') return;
    const props = (node.data?.hProperties ?? {}) as { id?: string };
    node.data ??= {};
    node.data.hProperties = props;
    if (typeof props.id !== 'string' || props.id.length === 0) return;

    let id = props.id;
    if (!used.has(id)) {
      used.add(id);
      return;
    }
    let n = 1;
    while (used.has(`${id}-${n}`)) n += 1;
    props.id = `${id}-${n}`;
    used.add(props.id);
  });
}

export function remarkPreview() {
  return async (tree: MdastNode, file: VFileLike) => {
    previewSeq.set(file as object, 0);
    await expandPreviews(tree, file);
    uniquifyHeadingIds(tree);
  };
}

async function expandPreviews(parent: MdastNode, file: VFileLike): Promise<void> {
  const children = parent.children;
  if (!children) return;

  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    if (child.type === 'containerDirective' && child.name === 'preview') {
      const expanded = await expandPreview(child as DirectiveNode, file);
      children.splice(i, 1, ...expanded);
      i += expanded.length - 1;
      continue;
    }
    await expandPreviews(child, file);
  }
}

function isMdEscapeFence(node: MdastNode): boolean {
  if (node.type !== 'code' || typeof node.value !== 'string') return false;
  const lang = typeof node.lang === 'string' ? node.lang.toLowerCase() : '';
  return lang === 'md' || lang === 'markdown';
}

function fileText(file: VFileLike): string {
  if (typeof file.value === 'string') return file.value;
  if (file.value == null) return '';
  if (Buffer.isBuffer(file.value)) return file.value.toString('utf8');
  return String(file.value);
}

function offsetOf(node: MdastNode, side: 'start' | 'end'): number | undefined {
  const pos = (node as Positioned).position?.[side]?.offset;
  return typeof pos === 'number' ? pos : undefined;
}

function sourceFromChildren(
  kids: MdastNode[],
  file: VFileLike,
): string | undefined {
  if (kids.length === 0) return undefined;

  if (kids.length === 1 && isMdEscapeFence(kids[0]!)) {
    return kids[0]!.value as string;
  }

  const raw = fileText(file);
  const start = offsetOf(kids[0]!, 'start');
  const end = offsetOf(kids[kids.length - 1]!, 'end');
  if (raw && start != null && end != null && end >= start) {
    return raw.slice(start, end).replace(/\r\n/g, '\n').trimEnd();
  }

  return undefined;
}

async function expandPreview(
  node: DirectiveNode,
  file: VFileLike,
): Promise<MdastNode[]> {
  const kids = contentChildren(node);
  const source = sourceFromChildren(kids, file);
  if (source === undefined) return kids;

  const label = extractDirectiveLabel(node);
  const previewNo = nextPreviewId(file);

  const input: JsxElement = {
    type: 'mdxJsxFlowElement',
    name: 'Input',
    attributes: label ? [jsxAttr('label', label)] : [],
    children: [
      {
        type: 'code',
        lang: 'md',
        meta: 'title="example.md" lineNumbers',
        value: source,
      },
    ],
  };

  const parsed = await processOutputBody(source, file, previewNo);

  const output: JsxElement = {
    type: 'mdxJsxFlowElement',
    name: 'Output',
    attributes: [],
    children: parsed.children ?? [],
  };

  const preview: JsxElement = {
    type: 'mdxJsxFlowElement',
    name: 'Preview',
    attributes: [],
    children: [input as unknown as MdastNode, output as unknown as MdastNode],
  };

  return [preview as unknown as MdastNode];
}

async function processOutputBody(
  source: string,
  file: VFileLike,
  previewNo: number,
): Promise<MdastNode> {

  const { remarkInclude } = await import('fumadocs-core/mdx-plugins');

  const slugger = new GithubSlugger();

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkDirectives)
    .use(remarkInclude)
    .use(remarkImage, { publicDir: 'public', useImport: false })
    .use(remarkNpm)
    .use(remarkCodeTab)
    .use(remarkMdxFiles)
    .use(remarkMdxMermaid)
    .use(remarkSteps)
    .use(remarkHeading, {
      generateToc: false,
      customId: false,
      slug: (_root, _heading, text: string) =>
        `preview-${previewNo}-${slugger.slug(text) || 'section'}`,
    });

  const tree = processor.parse({ value: source, path: file.path });
  const subFile = Object.assign(
    Object.create(Object.getPrototypeOf(file)) as VFileLike,
    file,
    { value: source },
  );
  const result = (await processor.run(
    tree,
    subFile as never,
  )) as unknown as MdastNode;

  walk(result, (node) => {
    if (node.type === 'heading') markHeadingNoToc(node);
  });

  return result;
}

