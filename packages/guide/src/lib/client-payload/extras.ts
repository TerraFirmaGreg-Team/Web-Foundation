import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { stackDisplayName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import { loadClientKeybinds } from '@terrafirmagreg-team/dump/lib/dump/client/keybinds';
import { guideEmbeds } from '@terrafirmagreg-team/guide/lib/embeds';
import { loadClientRegistry } from '@terrafirmagreg-team/dump/lib/dump/client/registry';
import { parseStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { spriteIdsFromEntry } from '@terrafirmagreg-team/guide/lib/sprites';
import { recipeIds } from '@terrafirmagreg-team/guide/lib/recipe';
import { asMultiblock } from '@terrafirmagreg-team/guide/lib/meta';
import { glbFor } from '@terrafirmagreg-team/guide/lib/multiblock/url';
import { multiblockKey } from '@terrafirmagreg-team/guide/lib/multiblock';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideEntry, GuideEntryExtras } from '@terrafirmagreg-team/guide/types';
import { type QuestLinks, collectPageLinks } from './links';

export async function entryExtras(
  dataset: DatasetRef,
  lang: Lang,
  langMap: Record<string, string>,
  bookModId: string,
  bookPath: string,
  categoryByEntry: Map<string, string>,
  questLinks: QuestLinks,
  hrefs: Set<string>,
  entry: GuideEntry,
): Promise<GuideEntryExtras> {
  const pages = entry.pages ?? [];
  const recipes: GuideEntryExtras['recipes'] = {};
  const entities: GuideEntryExtras['entities'] = {};
  const entityNames: GuideEntryExtras['entityNames'] = {};
  const glbs: GuideEntryExtras['glbs'] = {};
  const registry = await loadClientRegistry(dataset, 'entities');

  await Promise.all(
    pages.map(async (page) => {
      await Promise.all(
        recipeIds(page).map(async (id) => {
          const recipe = await guideEmbeds().recipe?.load(dataset, id);
          if (recipe) recipes[id] = recipe;
        }),
      );
      const entityId =
        typeof page.entity === 'string' ? page.entity : undefined;
      if (entityId) {
        entityNames[entityId] = stackDisplayName(
          langMap,
          entityId,
          'entity',
          registry.get(entityId)?.display?.name,
        );
        const parsed = parseStackId(entityId);
        const record = parsed?.id ? registry.get(parsed.id) : undefined;
        if (parsed?.id && record) entities[parsed.id] = record;
      }
      await collectPageLinks(
        dataset,
        lang,
        bookModId,
        bookPath,
        categoryByEntry,
        questLinks,
        hrefs,
        page,
      );
      await Promise.all(
        [asMultiblock(page.model ?? page.multiblock), ...(page.multiblocks ?? []).map(asMultiblock)].map(
          async (spec) => {
            const key = multiblockKey(spec);
            if (!key || glbs[key]) return;
            const url = await glbFor(dataset, bookModId, spec);
            if (url) glbs[key] = url;
          },
        ),
      );
    }),
  );

  const spriteIds = spriteIdsFromEntry(entry);
  const atlasMods = [
    ...new Set(
      spriteIds
        .map((id) => id.replace(/^#/, '').split(':', 2)[0])
        .filter(Boolean),
    ),
  ];
  const atlasEntries = await Promise.all(
    atlasMods.map(
      async (modId) =>
        [modId, await loadClientModAtlases(dataset, modId)] as const,
    ),
  );

  return {
    atlases: Object.fromEntries(atlasEntries),
    keybinds: await loadClientKeybinds(dataset),
    recipes,
    entities,
    entityNames,
    glbs,
  };
}

