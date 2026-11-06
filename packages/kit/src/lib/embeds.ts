import type { SectionEmbeds } from '@terrafirmagreg-team/kit/types/embeds';

export type SectionEmbedId = keyof SectionEmbeds;

type EmbedOf<K extends SectionEmbedId> = NonNullable<SectionEmbeds[K]>;

const registry = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.embeds')
] ??= new Map<SectionEmbedId, unknown>()) as Map<SectionEmbedId, unknown>;

export function registerSectionEmbed<K extends SectionEmbedId>(
  id: K,
  embed: EmbedOf<K>,
): void {
  registry.set(id, embed);
}

export function sectionEmbeds(): SectionEmbeds {
  return Object.fromEntries(registry) as SectionEmbeds;
}
