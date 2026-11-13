'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { LangContent } from '@terrafirmagreg-team/translate/types/content';
import { UntranslatedContext } from '@terrafirmagreg-team/ui/hooks/use-lang';

export { UntranslatedContext };

export type LocaleNodeResult = { node: ReactNode; missing: boolean } | null;
export type LoadLocaleNode = (lang: Lang) => Promise<LocaleNodeResult>;

type LocaleCacheEntry = {
  result?: LocaleNodeResult;
  promise?: Promise<LocaleNodeResult>;
};

const LOCALE_CACHE_LIMIT = 30;
const localeNodeCache = new Map<string, Map<Lang, LocaleCacheEntry>>();

function localeCacheMap(key: string): Map<Lang, LocaleCacheEntry> {
  let map = localeNodeCache.get(key);
  if (!map) {
    map = new Map();
    if (localeNodeCache.size >= LOCALE_CACHE_LIMIT) {
      const oldest = localeNodeCache.keys().next().value;
      if (oldest !== undefined) localeNodeCache.delete(oldest);
    }
  }
  localeNodeCache.delete(key);
  localeNodeCache.set(key, map);
  return map;
}

function localeCacheRead(key: string): Partial<Record<Lang, LocaleNodeResult>> {
  const out: Partial<Record<Lang, LocaleNodeResult>> = {};
  for (const [lang, entry] of localeNodeCache.get(key) ?? []) {
    if (entry.result !== undefined) out[lang] = entry.result;
  }
  return out;
}

export function LangContentSwitch({
  content,
  loadLang,
  cacheKey,
}: {
  content: LangContent;
  loadLang?: LoadLocaleNode;
  cacheKey?: string;
}) {
  const lang = useResolvedLang();
  const [loaded, setLoaded] = useState<Partial<Record<Lang, LocaleNodeResult>>>(
    () => (cacheKey ? localeCacheRead(cacheKey) : {}),
  );
  const result =
    lang === content.lang
      ? { node: content.node, missing: false }
      : (loaded[lang] ??
        (cacheKey
          ? localeNodeCache.get(cacheKey)?.get(lang)?.result
          : undefined));

  useEffect(() => {
    if (!loadLang || lang === content.lang || lang in loaded) return;
    const map = cacheKey ? localeCacheMap(cacheKey) : undefined;
    const entry = map?.get(lang);
    if (entry?.result !== undefined) {
      setLoaded((map) => (lang in map ? map : { ...map, [lang]: entry.result }));
      return;
    }
    let live = true;
    const promise = entry?.promise ?? loadLang(lang);
    if (map && !entry?.promise) map.set(lang, { promise });
    void promise.then((next) => {
      map?.set(lang, { result: next });
      if (live) {
        setLoaded((map) => (lang in map ? map : { ...map, [lang]: next }));
      }
    });
    return () => {
      live = false;
    };
  }, [lang, content.lang, loadLang, loaded, cacheKey]);

  const missing =
    result === undefined
      ? !loadLang && lang !== content.lang
      : (result?.missing ?? lang !== content.lang);
  return (
    <UntranslatedContext.Provider value={missing}>
      {(result ?? content).node}
    </UntranslatedContext.Provider>
  );
}

