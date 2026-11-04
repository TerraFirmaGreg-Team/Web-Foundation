import { registerPreviewResolver } from '@terrafirmagreg-team/preview/lib';
import { loadQuestCompactIndex } from '@terrafirmagreg-team/quest/lib/client/quest';
import { questTaskIconRefs } from '@terrafirmagreg-team/quest/lib/display';
import { entryPreviewIcon } from '@terrafirmagreg-team/game/lib/preview';
import { classifyRefId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { PreviewResolverCtx } from '@terrafirmagreg-team/preview/lib';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

export async function questLinkPreview({
  parts,
  query,
  lang,
}: PreviewResolverCtx): Promise<PagePreviewData | undefined> {
  const dataset = {
    id: parts[1] ?? '',
    version: query.get('version') ?? undefined,
  };
  const category = query.get('category');
  if (!dataset.id || !category) return undefined;
  const index = await loadQuestCompactIndex(dataset, lang);
  const questId = query.get('id');
  if (questId) {
    const quest = index.quests.find((row) => row.id === questId);
    if (!quest) return undefined;
    return {
      title: quest.title || quest.id,
      icon: entryPreviewIcon(
        questTaskIconRefs({
          icon: quest.icon,
          iconKind: quest.iconKind,
          tasks: quest.tasks ?? [],
        })[0],
        dataset,
      ),
    };
  }
  const chapter = index.chapters.find((row) => row.filename === category);
  if (!chapter) return undefined;
  return {
    title: chapter.title || category,
    icon: entryPreviewIcon(
      chapter.icon ? classifyRefId(chapter.icon, chapter.iconKind) : undefined,
      dataset,
    ),
  };
}

registerPreviewResolver('quest', questLinkPreview);

