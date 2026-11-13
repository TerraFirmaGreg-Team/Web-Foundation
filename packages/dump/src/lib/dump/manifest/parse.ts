import {
  asNumber,
  asRecord,
  asString,
  asStringList,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type {
  DumpIndexes,
  DumpManifest,
  DumpProducer,
  DumpText,
  NamespaceDisplay,
  PackInfo,
  RecipeTypeRow,
} from '@terrafirmagreg-team/dump/lib/dump/manifest/dto';

function asProducer(value: unknown): DumpProducer | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const name = asString(row.name);
  const platform = asString(row.platform);
  const minecraft = asString(row.minecraft);
  if (!name || !platform || !minecraft) return undefined;
  return { name, platform, minecraft };
}

function asPackInfo(value: unknown): PackInfo | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const id = asString(row.id);
  if (!id) return undefined;
  return { id, version: typeof row.version === 'string' ? row.version : null };
}

function asDumpText(value: unknown): DumpText | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const out: DumpText = {};
  const text = asString(row.text);
  const translate = asString(row.translate);
  const keybind = asString(row.keybind);
  if (text !== undefined) out.text = text;
  if (translate !== undefined) out.translate = translate;
  if (keybind !== undefined) out.keybind = keybind;
  if (Array.isArray(row.with)) {
    out.with = row.with.flatMap((entry) => {
      const part = asDumpText(entry);
      return part ? [part] : [];
    });
  }
  if (Array.isArray(row.extra)) {
    out.extra = row.extra.flatMap((entry) => {
      const part = asDumpText(entry);
      return part ? [part] : [];
    });
  }
  return out;
}

function asDisplay(value: unknown): NamespaceDisplay['display'] | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const name = asString(row.name);
  if (!name) return undefined;
  const tooltipMods: Record<string, DumpText[]> = {};
  const modsRow = asRecord(row.tooltipMods);
  if (modsRow) {
    for (const [mod, entries] of Object.entries(modsRow)) {
      if (!Array.isArray(entries)) continue;
      tooltipMods[mod] = entries.flatMap((entry) => {
        const text = asDumpText(entry);
        return text ? [text] : [];
      });
    }
  }
  return {
    name,
    tooltip: Array.isArray(row.tooltip)
      ? row.tooltip.flatMap((entry) => {
          const text = asDumpText(entry);
          return text ? [text] : [];
        })
      : [],
    tooltipMods,
  };
}

function asNamespaces(
  value: unknown,
): Record<string, NamespaceDisplay> | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const out: Record<string, NamespaceDisplay> = {};
  for (const [ns, entry] of Object.entries(row)) {
    if (!ns || ns.includes('/') || ns.includes('\\') || ns.includes('..')) {
      continue;
    }
    const nsRow = asRecord(entry);
    const display = asDisplay(nsRow?.display);
    if (!display) continue;
    out[ns] = {
      display,
      registry: asStringList(nsRow?.registry) ?? [],
      guides: asStringList(nsRow?.guides) ?? [],
      languages: asStringList(nsRow?.languages) ?? [],
      quests: nsRow?.quests === true,
      keybinds: nsRow?.keybinds === true,
    };
  }
  return out;
}

function asRecipeTypeRow(value: unknown): RecipeTypeRow | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const id = asString(row.id);
  const count = asNumber(row.count);
  const rows = asString(row.rows);
  if (!id || count === undefined || !rows) return undefined;
  return { id, count, rows };
}

function asIndexes(value: unknown): DumpIndexes | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  const recipesRow = asRecord(row.recipes);
  if (!recipesRow || !Array.isArray(recipesRow.types)) return undefined;
  const types = recipesRow.types.flatMap((entry) => {
    const typeRow = asRecipeTypeRow(entry);
    return typeRow ? [typeRow] : [];
  });
  const quests: Record<string, string> = {};
  const questsRow = asRecord(row.quests);
  if (questsRow) {
    for (const [ns, path] of Object.entries(questsRow)) {
      if (typeof path === 'string' && path) quests[ns] = path;
    }
  }
  return {
    recipes: { types },
    quests,
    used: asStringList(row.used) ?? [],
  };
}

export function parseDumpManifest(value: unknown): DumpManifest | undefined {
  const row = asRecord(value);
  if (!row) return undefined;
  if (asString(row.schema) !== 'manifest') return undefined;
  const producer = asProducer(row.producer);
  const indexes = asIndexes(row.indexes);
  const namespaces = asNamespaces(row.namespaces);
  if (!producer || !indexes || !namespaces) return undefined;
  return {
    schema: 'manifest',
    producer,
    pack: asPackInfo(row.pack) ?? null,
    languages: asStringList(row.languages),
    layout: asString(row.layout) ?? 'v1',
    namespaces,
    indexes,
  };
}
