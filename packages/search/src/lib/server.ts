import 'server-only';
import { initAdvancedSearch } from 'fumadocs-core/search/server';
import { searchConfig } from './config';
import type { LocalizedIndex } from './indexes';

type LangServer = { export(): Promise<unknown> };

async function createLangServers() {
  const config = searchConfig();
  const indexes = await config.indexes();
  const byLang = new Map<string, LocalizedIndex[]>();
  for (const index of indexes) {
    const list = byLang.get(index.locale) ?? [];
    if (!list.length) byLang.set(index.locale, list);
    list.push(index);
  }
  const servers = new Map<string, LangServer>();
  for (const [lang, langIndexes] of byLang) {
    servers.set(
      lang,
      initAdvancedSearch({ indexes: langIndexes, localeFilter: true }),
    );
  }
  return servers;
}

let cached: Promise<Map<string, LangServer>> | undefined;

function langServers() {
  const p = (cached ??= createLangServers());
  p.catch(() => {
    if (cached === p) cached = undefined;
  });
  return p;
}

async function exportFor(langs: Iterable<string>) {
  const servers = await langServers();
  const data: Record<string, unknown> = {};
  await Promise.all(
    [...langs].map(async (lang) => {
      const server = servers.get(lang);
      if (server) data[lang] = await server.export();
    }),
  );
  return { type: 'i18n' as const, data };
}

export function searchExport() {
  return langServers().then((servers) => exportFor(servers.keys()));
}

export function searchExportLang(lang: string) {
  return exportFor([lang]);
}

