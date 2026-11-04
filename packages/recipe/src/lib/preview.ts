import { registerPreviewResolver } from '@terrafirmagreg-team/preview/lib';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadDatasetRecipeCategories } from '@terrafirmagreg-team/recipe/lib/data/category/load';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { entryPreviewIcon } from '@terrafirmagreg-team/game/lib/preview';
import type { PreviewResolverCtx } from '@terrafirmagreg-team/preview/lib';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

export async function recipeLinkPreview({
  parts,
  query,
  langMap,
}: PreviewResolverCtx): Promise<PagePreviewData | undefined> {
  const dataset = {
    id: parts[1] ?? '',
    version: query.get('version') ?? undefined,
  };
  if (!dataset.id) return undefined;
  const type = query.get('type');
  if (!type) return { title: 'Recipes' };
  const categories = await loadDatasetRecipeCategories(dataset);
  const row = categories.find((category) => category.id === type);
  if (!row) return { title: type };
  return {
    title:
      (row.display?.name && langString(langMap, row.display.name)) || row.id,
    icon: entryPreviewIcon(row.icon, dataset),
  };
}

registerPreviewResolver('recipe', recipeLinkPreview, { langMap: clientDumpLang });

