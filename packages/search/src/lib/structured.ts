import type { StructuredData } from 'fumadocs-core/mdx-plugins';

type StructuredPageData = Record<string, unknown>;

export async function pageStructuredData(
  data: StructuredPageData,
): Promise<StructuredData> {
  const raw = data.structuredData;
  if (typeof raw === 'function') {
    const result = await (raw as () => Promise<StructuredData> | StructuredData)();
    if (!result) throw new Error('Cannot find structured data from page');
    return result;
  }
  if (typeof data.load === 'function') {
    const loaded = await (
      data.load as () => Promise<{ structuredData?: StructuredData }>
    )();
    if (!loaded.structuredData) {
      throw new Error('Cannot find structured data from page');
    }
    return loaded.structuredData;
  }
  if (!raw) throw new Error('Cannot find structured data from page');
  return raw as StructuredData;
}

