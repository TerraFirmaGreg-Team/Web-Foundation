import type { SectionLayoutOptions } from '@terrafirmagreg-team/kit/types';

const registry = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.section-layout')
] ??= new Map<string, SectionLayoutOptions>()) as Map<
  string,
  SectionLayoutOptions
>;

export function registerSectionLayout(
  section: string,
  options: SectionLayoutOptions,
): void {
  registry.set(section, options);
}

export function sectionLayoutOptions(
  section: string,
): SectionLayoutOptions | undefined {
  return registry.get(section);
}
