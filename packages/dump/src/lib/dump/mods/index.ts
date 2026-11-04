import type {
  DumpManifest,
  NamespaceDisplay,
} from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';
import type { DumpIndex, DumpMod, GuideBookRef } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';

function registryRel(
  meta: NamespaceDisplay,
  file: string,
): string | null {
  return meta.registry.includes(file) ? `registry/${file}.json` : null;
}

function loadBooks(
  namespace: string,
  guides: string[],
): GuideBookRef[] {
  const books: GuideBookRef[] = [];
  for (const name of guides) {
    if (!name || name.includes('..') || name.includes('/')) continue;
    books.push({
      modId: namespace,
      bookPath: name,
      bookId: `${namespace}:${name}`,
      dir: `data/${namespace}/guides/${name}`,
    });
  }
  return books;
}

function loadMod(
  namespace: string,
  meta: NamespaceDisplay,
): DumpMod {
  return {
    namespace,
    keybindsFile: meta.keybinds ? 'keybinds.json' : null,
    items: registryRel(meta, 'items'),
    blocks: registryRel(meta, 'blocks'),
    fluids: registryRel(meta, 'fluids'),
    entities: registryRel(meta, 'entities'),
    tabs: registryRel(meta, 'tabs'),
    groups: registryRel(meta, 'groups'),
    recipeCategories: registryRel(meta, 'recipe_categories'),
    tags: registryRel(meta, 'tags'),
    recipeIndex: registryRel(meta, 'recipes'),
    questData: meta.quests ? `data/${namespace}/quests/data.json` : null,
    books: loadBooks(namespace, meta.guides),
  };
}

export function dumpIndexFromManifest(
  manifest: DumpManifest,
  root: string,
): DumpIndex {
  const mods = Object.keys(manifest.namespaces)
    .sort((a, b) => a.localeCompare(b))
    .flatMap((namespace) => {
      const row = manifest.namespaces[namespace];
      return row ? [loadMod(namespace, row)] : [];
    });
  return { root, manifest, mods };
}

const REGISTRY_FIELD = {
  items: 'items',
  blocks: 'blocks',
  fluids: 'fluids',
  entities: 'entities',
  tabs: 'tabs',
  groups: 'groups',
  recipe_categories: 'recipeCategories',
  tags: 'tags',
  recipes: 'recipeIndex',
} as const satisfies Record<string, keyof DumpMod>;

export function dumpRegistryRel(
  dump: DumpIndex | null | undefined,
  file: string,
): string | undefined {
  const field = REGISTRY_FIELD[file as keyof typeof REGISTRY_FIELD];
  if (!field) return undefined;
  return dump?.mods.some((mod) => mod[field] != null)
    ? `registry/${file}.json`
    : undefined;
}

export function dumpModRegistryRel(
  dump: DumpIndex | null | undefined,
  namespace: string,
  file: string,
): string | undefined {
  const field = REGISTRY_FIELD[file as keyof typeof REGISTRY_FIELD];
  const mod = dump?.mods.find((m) => m.namespace === namespace);
  return field && mod?.[field] ? `registry/${file}.json` : undefined;
}

