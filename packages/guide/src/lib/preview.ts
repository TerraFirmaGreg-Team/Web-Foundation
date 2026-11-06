import { registerPreviewResolver } from '@terrafirmagreg-team/preview/lib';
import { loadClientGuideBook } from '@terrafirmagreg-team/guide/lib/client/books';
import { guidePlainText } from '@terrafirmagreg-team/guide/lib/display/format';
import { entryPreviewIcon } from '@terrafirmagreg-team/game/lib/preview';
import type { PreviewResolverCtx } from '@terrafirmagreg-team/preview/lib';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

export async function guideLinkPreview({
  parts,
  query,
  lang,
  langMap,
}: PreviewResolverCtx): Promise<PagePreviewData | undefined> {
  const dataset = {
    id: parts[1] ?? '',
    version: query.get('version') ?? undefined,
  };
  const bookId = query.get('book');
  if (!dataset.id || !bookId) return undefined;
  const index = await loadClientGuideBook(dataset, lang, bookId);
  if (!index) return undefined;
  const entryId = query.get('entry');
  if (entryId) {
    const entry = index.entries.find((row) => row.id === entryId);
    if (!entry) return undefined;
    return {
      title: entry.name ?? entry.id,
      icon: entryPreviewIcon(entry.icon, dataset),
    };
  }
  return {
    title: index.book?.name ?? bookId,
    description: index.book?.landingText
      ? guidePlainText(index.book.landingText, {
          macros: index.book?.macros,
          langMap,
        })
      : undefined,
    icon: entryPreviewIcon(index.book?.cover ?? undefined, dataset),
  };
}

registerPreviewResolver('guide', guideLinkPreview);

