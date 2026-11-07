export * from './providers';

export async function renderSectionMarkdown(page: {
  data: {
    title?: string;
    content?: string;
    getText?: (type: 'processed' | 'raw') => Promise<string>;
  };
}) {
  const body = page.data.getText
    ? await page.data.getText('processed')
    : (page.data.content ?? '');
  return `# ${page.data.title}

${body}`;
}

