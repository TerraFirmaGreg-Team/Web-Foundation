'use client';
import type TurndownService from 'turndown';

function decodedUrl(raw: string): string {
  const url = raw.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(run);
    } catch {
      return run;
    }
    return /[/?#&=%+]/.test(decoded) ? run : decoded;
  });
  return /[\s<>()]/.test(url) ? `<${url}>` : url;
}

let servicePromise: Promise<TurndownService> | undefined;

function turndownService(): Promise<TurndownService> {
  servicePromise ??= (async () => {
    const [{ default: TurndownServiceImpl }, { gfm }] = await Promise.all([
      import('turndown'),
      // @ts-expect-error -- no published type declarations
      import('turndown-plugin-gfm'),
    ]);
    const service = new TurndownServiceImpl({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });
    service.use(gfm);
    service.remove([
      'script',
      'style',
      'noscript',
      'template',
      'button',
      'select',
      'nav',
      'aside',
      'footer',
    ]);
    service.remove(
      (node) =>
        node.nodeName === 'SVG' ||
        (node instanceof HTMLImageElement &&
          (node.src.startsWith('data:') ||
            (node.width > 0 && node.width <= 48))) ||
        (node instanceof HTMLElement && node.dataset.mdSkip !== undefined),
    );
    service.addRule('decodedLink', {
      filter: 'a',
      replacement(content, node) {
        const anchor = node as HTMLAnchorElement;
        const href = anchor.getAttribute('href');
        if (!href) return content;
        const title = anchor.getAttribute('title');
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return `[${content}](${decodedUrl(href)}${titlePart})`;
      },
    });
    service.addRule('decodedImage', {
      filter: 'img',
      replacement(_content, node) {
        const image = node as HTMLImageElement;
        const src = image.getAttribute('src');
        if (!src) return '';
        const alt = image.getAttribute('alt') ?? '';
        const title = image.getAttribute('title');
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : '';
        return `![${alt}](${decodedUrl(src)}${titlePart})`;
      },
    });
    return service;
  })();
  return servicePromise;
}

export async function domToMarkdown(
  root: Element | null | undefined,
): Promise<string> {
  if (!root) return '';
  return (await turndownService()).turndown(root as HTMLElement);
}

export function pageMarkdown(
  root: Element | null | undefined,
  title: string,
): Promise<string> {
  return domToMarkdown(root).then((body) => `# ${title}\n\n${body}`);
}

export async function openPageMarkdown(
  root: Element | null | undefined,
  title: string,
): Promise<void> {
  const markdown = await pageMarkdown(root, title);
  const url = URL.createObjectURL(
    new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
  );
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

