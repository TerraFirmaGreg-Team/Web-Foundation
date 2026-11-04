import {
  BookOpen,
  Combine,
  History,
  Map,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import type { SiteKey } from './hosts';

export const docsRoute = '/docs';
export const changelogRoute = '/changelog';
export const guideRoute = '/guide';
export const recipeRoute = '/recipe';
export const questRoute = '/quest';

export const sectionTabs = [
  { key: 'docs', url: docsRoute, icon: BookOpen },
  { key: 'guide', url: guideRoute, icon: Map, dump: true },
  { key: 'recipe', url: recipeRoute, icon: Combine, dump: true, immersive: true },
  { key: 'quest', url: questRoute, icon: ScrollText, dump: true, immersive: true },
  { key: 'changelog', url: changelogRoute, icon: History },
] as const satisfies readonly {
  key: string;
  url: string;
  icon: LucideIcon;
  dump?: boolean;
  immersive?: boolean;
  site?: SiteKey;
}[];

export type SectionKey = (typeof sectionTabs)[number]['key'];

export const dumpSections = new Set<SectionKey>(
  sectionTabs.filter((s) => 'dump' in s && s.dump).map((s) => s.key),
);

export const immersiveSections: ReadonlySet<string> = new Set(
  sectionTabs
    .filter((s) => 'immersive' in s && s.immersive)
    .map((s) => s.key),
);
