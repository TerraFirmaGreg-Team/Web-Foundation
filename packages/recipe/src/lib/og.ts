import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { clientDumpLangNames } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadClientTagMembers } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import {
  ogIconParam,
  ogLocalized,
  ogStackIcon,
  ogStackName,
} from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import {
  ogImageQuery,
  ogName,
  registerOgIconResolver,
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
    const glyph = TOOL_GLYPH[tool];
    const entity = {
      kind: 'tool',
      name: recipeToolName(tool, lang),
      ...(glyph ? { icon: `glyph:${glyph}` } : {}),
    };
    return { entity, imageQuery: ogImageQuery(entity, tool) };
  }
  const item = search.get('item');
  const fluid = search.get('fluid');
  if (item || fluid) {
    const kind = fluid ? 'fluid' : 'item';
    const id = (item ?? fluid)!;
    const entity = {
      kind,
      name: await ogStackName(dataset, id, kind, lang),
      id,
      icon: `${kind}:${id}`,
    };
    return {
      entity,
      description: id,
      imageQuery: ogImageQuery(entity, id),
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
    const entity = {
      kind: 'tag',
      name: `#${tagId || id}`,
      id,
      icon: `${tagKind}Tag:#${tagId || id}`,
    };
    const description =
      list != null
        ? `${list.length} member${list.length === 1 ? '' : 's'}`
        : `${tagKind} tag`;
    return { entity, description, imageQuery: ogImageQuery(entity, description) };
  }
  if (id) {
    const recipe = await loadClientRecipe(dataset, id);
    if (!recipe) return {};
    const out = recipe.outputs[0];
    const [categories, map] = await Promise.all([
      loadDatasetRecipeCategories(dataset),
      clientDumpLangNames(dataset, lang),
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
    const entity = {
      kind: 'recipe',
      name,
      id: recipe.id,
      ...(out ? { icon: `${out.kind === 'fluid' ? 'fluid' : 'item'}:${out.id}` } : {}),
    };
    const description = catName ?? recipe.id;
    return { entity, description, imageQuery: ogImageQuery(entity, description) };
  }
  if (!type || type === 'all') return {};
  const [categories, map] = await Promise.all([
    loadDatasetRecipeCategories(dataset),
    clientDumpLangNames(dataset, lang),
  ]);
  const category = categories.find((row) => row.id === type);
  if (!category) return {};
  const localized =
    ogLocalized(map, category.display?.name) ?? category.id;
  const icon = ogIconParam(category.icon);
  const entity = {
    kind: 'category',
    ...ogName(localized),
    id: category.id,
    ...(icon ? { icon } : {}),
  };
  return {
    entity,
    description: category.id,
    imageQuery: ogImageQuery(entity, category.id),
  };
}

const TOOL_GLYPH: Record<string, string> = {
  calc: 'calculator',
  forge: 'anvil',
  alloy: 'flask',
};

registerOgResolver('recipe', recipeOgContext);
registerOgIconResolver(ogStackIcon);
