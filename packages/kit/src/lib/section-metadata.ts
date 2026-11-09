import 'server-only';
import type { Metadata } from 'next';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import type { SectionKey } from '@terrafirmagreg-team/sites/sections';
import { sectionConfig } from './config';

export function sectionDisplayName(section: SectionKey): string {
  const { messages, defaultLanguage } = loadLocaleRegistry();
  const table = messages[defaultLanguage] ?? {};
  const suffix = `(sections.${section})`;
  return (
    table[`sections.${section}`] ??
    Object.entries(table).find(([key]) => key.endsWith(suffix))?.[1] ??
    section
  );
}

export function withSectionTitle<A>(
  generateMetadata: (args: A) => Promise<Metadata>,
  section: SectionKey,
): (args: A) => Promise<Metadata> {
  return async (args) => {
    const meta = await generateMetadata(args);
    return {
      ...meta,
      title: {
        absolute: `${sectionConfig().appName} | ${sectionDisplayName(section)}`,
      },
    };
  };
}
