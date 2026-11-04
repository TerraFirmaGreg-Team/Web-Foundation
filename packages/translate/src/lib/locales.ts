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

