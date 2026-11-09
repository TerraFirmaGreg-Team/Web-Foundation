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
  paired?: boolean;
  remark?: boolean;
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
  gradient: {
    colon: 2,
    paired: true,
    multiline: ['children'],
    props: ['from', 'to', 'dir', 'image', 'children', 'className'],
    descriptions: {
      from: 'Gradient start color',
      to: 'Gradient end color',
      dir: 'CSS gradient direction (to right, 135deg, …)',
      image: 'CSS image overriding the gradient',
      children: 'Body markdown inside the ::gradient … :: block',
    },
  },
  video: {
    colon: 2,
    props: ['src', 'title', 'className'],
    descriptions: {
      src: 'Embed URL (e.g. youtube-nocookie embed)',
      title: 'Accessible frame title',
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
    variants: {
      Alert: {
        raw: '> [!TIP]\nA GitHub alert blockquote.',
      },
    },
  },
  banner: {
    colon: 3,
    multiline: ['children'],
    props: ['id', 'height', 'variant', 'gradient', 'from', 'to', 'dir', 'image', 'rainbowColors', 'changeLayout', 'children', 'className'],
    descriptions: {
      variant: 'normal | rainbow | fade (gradient ring, fades down) | glow (radial bg + shadow)',
      gradient: 'Gradient-fill the title text',
    },
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
    props: ['format', 'multiple', 'defaultValue', 'children', 'className'],
    descriptions: {
      format:
        'Input format — details: single :::details[Title] block; accordions: :::accordions group with ::accordion[Title] items; jsx: raw <Accordions>/<Accordion> markup',
    },
    variants: {
      Details: {
        raw: ':::details[Summary]\nHidden content.\n:::',
      },
      Open: {
        raw: ':::details[Summary]{open}\nHidden content.\n:::',
      },
      'Multiple': {
        raw: ':::accordions{multiple}\n::accordion[First]\nContent one.\n::accordion[Second]\nContent two.\n:::',
      },
      'Nested': {
        raw: '::::details[Outer]{open}\nBefore.\n:::accordions\n::accordion[Inner one]\nNested answer one.\n::accordion[Inner two]\nNested answer two.\n:::\n::::',
      },
    },
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
    props: ['format', 'children'],
    descriptions: {
      format:
        'Input format — list: :::files markdown list; fenced: ```files code block',
      name: 'Entry name — file or folder label',
      icon: 'Custom icon name or path',
      href: 'Link target — renders the entry as an anchor',
      description: 'Muted description line under the entry',
      disabled: 'Folder only — renders the entry as non-interactive',
      defaultOpen: 'Folder only — starts expanded',
      children:
        'Tree body — a ```files code fence or a :::files markdown list; items: [name](href "description"), trailing / or a nested list = folder',
    },
    variants: {
      List: {
        raw: ':::files\n- app/\n  - layout.tsx\n  - page.tsx\n- package.json\n:::',
      },
      Links: {
        raw: ':::files\n- [modpack/](/docs/modern/modpack "Modpack guides")\n  - [optional-mods.md](/docs/modern/modpack/optional-mods "Extra compatible mods")\n  - kubejs/\n    - server_scripts\n    - startup_scripts\n- [pakku.json](https://pakku.readthedocs.io "Pakku config")\n:::',
      },
      Deep: {
        raw: ':::files\n- content/\n  - docs/\n    - dev/\n      - components/\n        - index.md\n        - item.md\n        - meta.json\n      - meta.json\n  - index.mdx\n:::',
      },
      Fenced: {
        raw: '```files\nTerraFirmaGreg\n├── mods\n└── config\n```',
      },
    },
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
    props: ['format', 'children', 'block'],
    multiline: ['children'],
    descriptions: {
      format:
        'Input syntax — inline: :math[…] or $…$; block: ::math[…] leaf, :::math container, ```math fence or $$…$$',
      children: 'KaTeX source',
      block: 'Display block instead of inline',
    },
    variants: {
      Inline: { raw: ':math[e = mc^2]' },
      Dollar: { raw: '$e = mc^2$' },
      Leaf: {
        raw: '::math[\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}]',
      },
      Block: {
        raw: ':::math\n\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}\n:::',
      },
      Fenced: {
        raw: '```math\n\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}\n```',
      },
      Aligned: {
        raw: ':::math\n\\begin{aligned}\n\\nabla \\cdot \\vec{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\\n\\nabla \\times \\vec{B} &= \\mu_0 \\vec{J}\n\\end{aligned}\n:::',
      },
      Display: { raw: '$$e = mc^2$$' },
    },
  },
  og: {
    remark: false,
    props: ['url', 'section', 'dataset', 'slug', 'lang', 'version'],
    descriptions: {
      url: 'Page or image.png URL — overrides the fields below',
      section: 'Site section the page belongs to',
      dataset: 'Dataset id within the section',
      slug: 'Page path inside the dataset, e.g. getting-started/install',
      lang: 'Content language of the rendered card',
      version: 'Dataset version pin, e.g. 0.13.18',
    },
  },
  site: {
    remark: false,
    props: ['view', 'section', 'links'],
    descriptions: {
      view: 'What to show',
      section: 'Limit the listing to one section',
      links: 'URLs to preview in the links view (JSON array)',
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
      ::accordion[First]
      Content one.
      ::accordion[Second]
      Content two.
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
  if (meta.solo || (meta.colon !== 3 && !meta.paired)) return head;
  const inner =
    typeof args.children === 'string' && args.children ? args.children : '…';
  return `${head}\n${inner}\n${':'.repeat(meta.colon ?? 3)}`;
}

