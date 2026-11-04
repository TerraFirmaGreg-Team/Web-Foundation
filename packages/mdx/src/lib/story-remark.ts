import type { TypeNode } from '@fumadocs/story/type-tree';
import { md } from './md';

export type DirectiveMeta = {
  label?: string;
  colon?: 1 | 2 | 3;
  name?: string;
  nameArg?: string;
  fence?: string;
  body?: string;
  hide?: string[];
  multiline?: string[];
  props?: string[];
  solo?: boolean;
  descriptions?: Record<string, string>;
  raw?: string;
  variants?: Record<string, Partial<DirectiveMeta>>;
};

const ENTRY_PROPS = [
  'id',
  'dataset',
  'name',
  'size',
  'variant',
  'labeled',
  'label',
  'copy',
  'missing',
  'tooltip',
  'className',
];

const DIRECTIVE_META: Record<string, DirectiveMeta> = {
  item: { label: 'id', props: [...ENTRY_PROPS, 'href', 'tab', 'search'] },
  block: { label: 'id', props: [...ENTRY_PROPS, 'href', 'tab', 'search'] },
  fluid: { label: 'id', props: [...ENTRY_PROPS, 'href', 'tab', 'search'] },
  entity: {
    label: 'id',
    props: [...ENTRY_PROPS, 'view'],
    descriptions: {
      view: 'auto: texture→egg fallback · texture: registry texture · egg: spawn egg · model: 3D model',
    },
  },
  tag: { label: 'id', props: [...ENTRY_PROPS, 'href', 'tab', 'search'] },
  quest: {
    label: 'id',
    props: [...ENTRY_PROPS, 'filename', 'href'],
    descriptions: {
      id: 'Quest id (hex), chapter filename or localized title',
    },
  },
  guide: {
    label: 'id',
    props: [...ENTRY_PROPS, 'href', 'modId', 'bookPath', 'entry', 'hash'],
  },
  recipe: { label: 'id', props: ['id', 'dataset', 'maxH', 'className'] },
  multiblock: {
    label: 'id',
    multiline: ['spec'],
    props: ['id', 'name', 'spec', 'label', 'title', 'dataset', 'className'],
    descriptions: {
      id: 'Dump model id (ns:name or hash), resolved via multiblock index',
      name: 'Localized guide name, resolved via guide entries index',
      spec: 'Inline GuideMultiblock JSON (:::multiblock + ```json fence)',
    },
  },
  card: {
    label: 'title',
    props: [
      'title',
      'icon',
      'description',
      'href',
      'external',
      'children',
      'className',
    ],
  },
  'type-table': { colon: 3, solo: true, hide: ['type'], props: ['type'] },
  icon: {
    label: 'name',
    colon: 1,
    props: ['name', 'size', 'color', 'strokeWidth', 'className'],
    descriptions: {
      name: 'Lucide or Simple Icons name, kebab-case ok (book-open, github)',
      size: 'Icon size, number (px) or CSS length; defaults to 1em',
      color: 'Any CSS color: keyword (tomato), hex, rgb(), var(--x)',
      strokeWidth: 'Lucide stroke width, default 2',
    },
  },
  'gradient-text': {
    name: 'gradient',
    label: 'children',
    colon: 1,
    props: ['from', 'to', 'image', 'children', 'className'],
    descriptions: {
      from: 'Gradient start color',
      to: 'Gradient end color',
      image: 'CSS image overriding the gradient',
      children: 'Text content, the directive label',
    },
  },
  'glow-header': {
    name: 'glow',
    label: 'children',
    colon: 1,
    props: ['from', 'to', 'image', 'gradient', 'fade', 'children', 'className'],
    descriptions: {
      from: 'Gradient start color',
      to: 'Gradient end color',
      image: 'CSS image overriding the gradient',
      gradient: 'Also tint the background box with the gradient',
      fade: 'Gradient border along the bottom edge',
      children: 'Header text, the directive label',
    },
  },
  callout: {
    nameArg: 'type',
    label: 'title',
    colon: 3,
    multiline: ['children'],
    props: ['type', 'title', 'children', 'className'],
    descriptions: {
      type: 'Callout kind, becomes the directive name (:::info …)',
      title: 'Overrides the default localized title',
      children: 'Body markdown',
    },
  },
  banner: {
    colon: 3,
    multiline: ['children'],
    props: ['id', 'height', 'variant', 'rainbowColors', 'changeLayout', 'children', 'className'],
  },
  tabs: {
    colon: 3,
    props: [
      'items',
      'defaultIndex',
      'label',
      'persist',
      'groupId',
      'updateAnchor',
      'children',
      'className',
    ],
  },
  accordions: {
    colon: 3,
    props: ['multiple', 'defaultValue', 'children', 'className'],
  },
  image: {
    label: 'alt',
    colon: 3,
    solo: true,
    props: ['src', 'pack', 'mod', 'path', 'alt', 'width', 'height', 'caption', 'className', 'defaultPack'],
  },
  steps: {
    body: md`
      :::steps
      ### 1. …
      ### 2. …
      :::
    `,
    props: ['children'],
  },
  files: {
    fence: 'files',
    body: md`
      TerraFirmaGreg
      ├── mods
      └── config
    `,
    props: ['children'],
  },
  code: {
    fence: 'ts',
    body: 'const x = 1;',
    props: ['title', 'allowCopy', 'children', 'className'],
    variants: {
      Titled: {
        fence: 'ts title="hello.ts"',
        body: md`
          export function hello() {
            return "hi";
          }
        `,
      },
      'Line numbers': {
        fence: 'ts title="lines.ts" lineNumbers',
        body: md`
          const a = 1;
          const b = 2;
          const c = 3;
        `,
      },
      Highlight: {
        fence: 'ts {1,3}',
        body: md`
          const a = 1;
          const b = 2;
          const c = 3;
        `,
      },
      Diff: {
        fence: 'ts',
        body: md`
          const a = 1; // [!code --]
          const b = 2; // [!code ++]
          const c = 3;
        `,
      },
      Focus: {
        fence: 'ts',
        body: md`
          const a = 1;
          const b = 2; // [!code focus]
          const c = 3;
        `,
      },
      Word: {
        fence: 'ts',
        body: md`
          const amount = 42; // [!code word:amount]
        `,
      },
      'No copy': {
        fence: 'ts noCopy',
        body: 'const x = 1;',
      },
    },
  },
  twoslash: {
    fence: 'ts twoslash',
    body: md`
      const amount = 42;
      //    ^?
    `,
    props: [],
    variants: {
      Hover: {
        body: md`
          const amount = 42;
          amount.toFixed(2);
        `,
      },
      Errors: {
        body: md`
          const a: number = "oops";
          // @errors: 2322
        `,
      },
      Tags: {
        body: md`
          const amount = 42;
          // @log: computed once at build time
          // @warn: deprecated in favour of amount2
          // @annotate: see quest docs for usage
        `,
      },
      'Completions ^|': {
        body: md`
          const m = Math;
          m.a
          //  ^|
        `,
      },
      'Highlight ^^^': {
        body: md`
          const amount = 42;
          //    ^^^^^
        `,
      },
      Cut: {
        body: md`
          const secret = "hidden prelude";
          // ---cut---
          const amount = 42;
        `,
      },
    },
  },
  'code-tabs': {
    raw: md`
      \`\`\`ts tab="pnpm"
      pnpm add fumadocs-core
      \`\`\`

      \`\`\`ts tab="npm"
      npm install fumadocs-core
      \`\`\`
    `,
    props: [],
    variants: {
      'Package manager': {
        raw: md`
          \`\`\`npm
          npm install fumadocs-core
          \`\`\`
        `,
      },
      Synced: {
        raw: md`
          \`\`\`ts tab="pnpm" tab-group="pm"
          pnpm add fumadocs-core
          \`\`\`

          \`\`\`ts tab="npm" tab-group="pm"
          npm install fumadocs-core
          \`\`\`
        `,
      },
    },
  },
  mermaid: {
    fence: 'mermaid',
    body: '',
    multiline: ['chart'],
    props: ['chart'],
    descriptions: {
      chart: 'Mermaid diagram source, plain markdown inside the fence',
    },
  },
  math: {
    body: ':math[e = mc^2]',
    props: ['children', 'block'],
    multiline: ['children'],
    descriptions: {
      children: 'KaTeX source, the `:math[…]` label',
      block: 'Display block (`::math`/`:::math`) instead of inline `:math`',
    },
  },
};

export function directiveMeta(key: string): DirectiveMeta | undefined {
  return DIRECTIVE_META[key];
}

function attr(v: unknown): string | undefined {
  if (v === true) return undefined;
  if (v === false) return 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function tweakControls(
  key: string,
  node: TypeNode,
  defaults?: Record<string, unknown>,
): TypeNode {
  if (node.type !== 'object') return node;
  const meta = DIRECTIVE_META[key];
  const whitelist = meta?.props ? new Set(meta.props) : undefined;
  const multiline = new Set(meta?.multiline ?? []);
  const properties = node.properties
    .filter(
      (p) =>
        (!whitelist || whitelist.has(p.name)) &&
        (p.name !== 'children' ||
          defaults?.children === undefined ||
          typeof defaults.children === 'string'),
    )
    .map((p) =>
      multiline.has(p.name)
        ? { ...p, type: { ...p.type, multiline: true } as unknown as TypeNode }
        : p,
    );
  return { ...node, properties };
}

export function remarkFor(
  key: string,
  args: Record<string, unknown>,
  controls?: TypeNode,
  variant?: string,
): string {
  const base = DIRECTIVE_META[key] ?? {};
  const meta: DirectiveMeta = {
    ...base,
    ...(variant ? base.variants?.[variant] : undefined),
  };
  if (meta.raw) return meta.raw;
  if (key === 'tabs') {
    const items = Array.isArray(args.items)
      ? (args.items as unknown[]).map(String)
      : [];
    const attrs: string[] = [];
    const di = typeof args.defaultIndex === 'number' ? args.defaultIndex : 0;
    if (di > 0 && items[di]) attrs.push(`default="${items[di]}"`);
    if (typeof args.label === 'string' && args.label)
      attrs.push(`label="${args.label}"`);
    if (args.persist) attrs.push('persist');
    if (typeof args.groupId === 'string' && args.groupId)
      attrs.push(`groupId="${args.groupId}"`);
    if (args.updateAnchor) attrs.push('updateAnchor');
    const body = items.length
      ? items.map((item) => `::tab[${item}]\n…`).join('\n\n')
      : '::tab[…]\n…';
    return `:::tabs${attrs.length ? `{${attrs.join(' ')}}` : ''}\n${body}\n:::`;
  }
  if (key === 'accordions') {
    return md`
      :::accordions${args.multiple ? '{multiple}' : ''}
      ::accordion[Title one]
      …

      ::accordion[Title two]
      …
      :::
    `;
  }
  if (key === 'multiblock' && typeof args.spec === 'string' && args.spec) {
    return `:::multiblock\n\`\`\`json\n${args.spec}\n\`\`\`\n:::`;
  }
  if (key === 'math') {
    const tex = typeof args.children === 'string' ? args.children : 'e = mc^2';
    if (tex.includes(']'))
      return args.block ? `$$\n${tex}\n$$` : `$${tex}$`;
    if (args.block)
      return tex.includes('\n')
        ? `:::math\n${tex}\n:::`
        : `::math[${tex}]`;
    return `:math[${tex}]`;
  }
  if (meta.fence) {
    const body = key === 'mermaid' ? String(args.chart ?? '…') : meta.body;
    return '```' + meta.fence + '\n' + body + '\n```';
  }
  if (meta.body) return meta.body;
  const name = meta.nameArg
    ? String(args[meta.nameArg] ?? meta.name ?? key)
    : (meta.name ?? key);
  const skip = new Set(
    [
      'children',
      meta.label,
      meta.nameArg,
      ...(meta.hide ?? []),
    ].filter(Boolean),
  );
  const editable =
    controls?.type === 'object'
      ? new Set(controls.properties.map((p) => p.name))
      : undefined;
  const attrs = Object.entries(args)
    .filter(
      ([k, v]) =>
        !skip.has(k) &&
        (!editable || editable.has(k)) &&
        v !== undefined &&
        v !== '',
    )
    .map(([k, v]) => {
      const s = attr(v);
      return s === undefined ? k : `${k}="${s}"`;
    })
    .join(' ');
  const label =
    meta.label && args[meta.label] != null
      ? `[${String(args[meta.label])}]`
      : '';
  const head = `${':'.repeat(meta.colon ?? 2)}${name}${label}${attrs ? `{${attrs}}` : ''}`;
  if (meta.colon !== 3 || meta.solo) return head;
  const inner =
    typeof args.children === 'string' && args.children ? args.children : '…';
  return `${head}\n${inner}\n:::`;
}

