import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadClientTagMembers } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import type { ReferenceKind } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import {
  ogLocalized,
  ogRefSprite,
  ogStackName,
} from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import {
  ogName,
  registerOgResolver,
  type OgContext,
} from '@terrafirmagreg-team/preview/lib';
import { loadDatasetRecipeCategories } from './data/category/load';
import { loadClientRecipe } from './client/recipe';
import { recipeToolName } from './tool-names';

async function recipeOgContext(
  dataset: DatasetRef,
  search: URLSearchParams,
  lang: Lang,
): Promise<OgContext> {
  const tool = search.get('tool');
  if (tool) {
    return {
      entity: { kind: 'tool', name: recipeToolName(tool, lang) },
      imageQuery: `tool=${encodeURIComponent(tool)}`,
    };
  }
  const item = search.get('item');
  const fluid = search.get('fluid');
  if (item || fluid) {
    const kind = fluid ? 'fluid' : 'item';
    const id = (item ?? fluid)!;
    return {
      entity: {
        kind,
        name: await ogStackName(dataset, id, kind, lang),
        id,
      },
      icon: () => ogRefSprite(dataset, { kind, id }),
      description: id,
      imageQuery: `${kind}=${encodeURIComponent(id)}`,
    };
  }
  const type = search.get('type');
  const id = search.get('id');
  if (type === 'emi:tag' && id) {
    const [, tagKind = 'item', ns = '', ...rest] = id.split('/');
    const path = rest.join('/');
    const tagPath = path.startsWith(`${tagKind}s/`)
      ? path.slice(tagKind.length + 2)
      : path;
    const tagId = rest.length ? `${ns}:${tagPath}` : ns;
    const members = await loadClientTagMembers(dataset, tagKind);
    const list = tagId ? members?.[`#${tagId}`] : undefined;
    const first = list?.[0];
    return {
      entity: { kind: 'tag', name: `#${tagId || id}`, id },
      icon: first
        ? () =>
            ogRefSprite(dataset, {
              kind: tagKind as ReferenceKind,
              id: first,
            })
        : undefined,
      description:
        list != null
          ? `${list.length} member${list.length === 1 ? '' : 's'}`
          : `${tagKind} tag`,
      imageQuery: `type=emi:tag&id=${encodeURIComponent(id)}`,
    };
  }
  if (id) {
    const recipe = await loadClientRecipe(dataset, id);
    if (!recipe) return {};
    const out = recipe.outputs[0];
    const [categories, map] = await Promise.all([
      loadDatasetRecipeCategories(dataset),
      clientDumpLang(dataset, lang),
    ]);
    const category = categories.find((row) => row.id === recipe.type);
    const catName = category
      ? stripMcFormat(
          ogLocalized(map, category.display?.name) ?? category.id,
        ).trim()
      : undefined;
    const name = out
      ? await ogStackName(
          dataset,
          out.id,
          out.kind === 'fluid' ? 'fluid' : 'item',
          lang,
        ).catch(() => recipe.id)
      : recipe.id;
    return {
      entity: { kind: 'recipe', name, id: recipe.id },
      icon: out
        ? () =>
            ogRefSprite(dataset, {
              kind: out.kind === 'tag' ? 'itemTag' : out.kind,
              id: out.id,
            })
        : undefined,
      description: catName ?? recipe.id,
      imageQuery: `id=${encodeURIComponent(id)}`,
    };
  }
  if (!type || type === 'all') return {};
  const [categories, map] = await Promise.all([
    loadDatasetRecipeCategories(dataset),
    clientDumpLang(dataset, lang),
  ]);
  const category = categories.find((row) => row.id === type);
  if (!category) return {};
  const localized =
    ogLocalized(map, category.display?.name) ?? category.id;
  return {
    entity: { kind: 'category', ...ogName(localized), id: category.id },
    icon: () => ogRefSprite(dataset, category.icon),
    description: category.id,
    imageQuery: `type=${encodeURIComponent(type)}`,
  };
}

registerOgResolver('recipe', recipeOgContext);
