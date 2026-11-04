'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { LangContent } from '@terrafirmagreg-team/translate/types/content';
import { UntranslatedContext } from '@terrafirmagreg-team/ui/hooks/use-lang';

export { UntranslatedContext };

export type LocaleNodeResult = { node: ReactNode; missing: boolean } | null;
export type LoadLocaleNode = (lang: Lang) => Promise<LocaleNodeResult>;

export function LangContentSwitch({
  content,
  loadLang,
}: {
  content: LangContent;
  loadLang?: LoadLocaleNode;
}) {
  const lang = useResolvedLang();
  const [loaded, setLoaded] = useState<
    Partial<Record<Lang, LocaleNodeResult>>
  >({});
  const result =
    lang === content.lang
      ? { node: content.node, missing: false }
      : loaded[lang];

  useEffect(() => {
    if (!loadLang || lang === content.lang || lang in loaded) return;
    let live = true;
    void loadLang(lang).then((next) => {
      if (live) {
        setLoaded((map) => (lang in map ? map : { ...map, [lang]: next }));
      }
    });
    return () => {
      live = false;
    };
  }, [lang, content.lang, loadLang, loaded]);

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

