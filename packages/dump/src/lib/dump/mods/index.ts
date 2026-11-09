import type {
  DumpManifest,
  NamespaceDisplay,
} from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';
import type { DumpIndex, DumpMod, GuideBookRef } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';

export const SHARDED_REGISTRY = new Set([
  'items',
  'blocks',
  'fluids',
  'entities',
]);

function registryRel(
  meta: NamespaceDisplay,
  namespace: string,
  file: string,
): string | null {
  if (!meta.registry.includes(file)) return null;
  return SHARDED_REGISTRY.has(file)
    ? `registry/${file}/${namespace}.json`
    : `registry/${file}.json`;
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
    items: registryRel(meta, namespace, 'items'),
    blocks: registryRel(meta, namespace, 'blocks'),
    fluids: registryRel(meta, namespace, 'fluids'),
    entities: registryRel(meta, namespace, 'entities'),
    tabs: registryRel(meta, namespace, 'tabs'),
    groups: registryRel(meta, namespace, 'groups'),
    recipeCategories: registryRel(meta, namespace, 'recipe_categories'),
    tags: registryRel(meta, namespace, 'tags'),
    recipeIndex: registryRel(meta, namespace, 'recipes'),
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
  if (!field || SHARDED_REGISTRY.has(file)) return undefined;
  return dump?.mods.some((mod) => mod[field] != null)
    ? `registry/${file}.json`
    : undefined;
}

export function dumpRegistryNamespaces(
  dump: DumpIndex | null | undefined,
  file: string,
): string[] {
  const field = REGISTRY_FIELD[file as keyof typeof REGISTRY_FIELD];
  if (!field) return [];
  return (
    dump?.mods.flatMap((mod) =>
      mod[field] != null ? [mod.namespace] : [],
    ) ?? []
  );
}

export function dumpModRegistryRel(
  dump: DumpIndex | null | undefined,
  namespace: string,
  file: string,
): string | undefined {
  const field = REGISTRY_FIELD[file as keyof typeof REGISTRY_FIELD];
  if (!field) return undefined;
  return (
    dump?.mods.find((m) => m.namespace === namespace)?.[field] ?? undefined
  );
}

export function dumpRegistryIconsRel(
  dump: DumpIndex | null | undefined,
  namespace: string,
  file: string,
): string | undefined {
  if (file === 'entities') return undefined;
  const field = REGISTRY_FIELD[file as keyof typeof REGISTRY_FIELD];
  const mod = dump?.mods.find((m) => m.namespace === namespace);
  return field && SHARDED_REGISTRY.has(file) && mod?.[field]
    ? `registry/${file}/${namespace}.icons.json`
    : undefined;
}

