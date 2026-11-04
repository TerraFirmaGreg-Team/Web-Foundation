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

export function createNamespacedLocaleCatalogs(
  modules: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const catalogs: Record<string, Record<string, unknown>> = {};
  for (const [path, messages] of Object.entries(modules)) {
    const ns = path.slice(0, path.lastIndexOf('/'));
    const lang = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
    (catalogs[ns.slice(ns.lastIndexOf('/') + 1)] ??= {})[lang] = messages;
  }
  return catalogs;
}

