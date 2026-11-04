export function createLocaleCatalog(
  modules: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(modules).map(([path, messages]) => [
      path.slice(path.lastIndexOf('/') + 1, -'.json'.length),
      messages,
    ]),
  );
}

export function createLocaleCatalogs(
  modules: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const catalogs: Record<string, Record<string, unknown>> = {};
  for (const [path, messages] of Object.entries(modules)) {
    const dir = path.slice(0, path.lastIndexOf('/'));
    const catalog = dir.slice(dir.lastIndexOf('/') + 1);
    const lang = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
    (catalogs[catalog] ??= {})[lang] = messages;
  }
  return catalogs;
}

