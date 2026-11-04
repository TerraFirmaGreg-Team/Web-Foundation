import 'server-only';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export {
  creativeTabName,
  isTechnicalId,
  langString,
  resolveName,
} from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

export function loadMergedLangMap(
  dataset: DatasetRef,
  lang: Lang,
): Promise<Record<string, string>> {
  return clientDumpLang(dataset, lang);
}

