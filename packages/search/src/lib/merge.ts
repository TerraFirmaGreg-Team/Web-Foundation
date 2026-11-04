import type { SearchClient } from 'fumadocs-core/search/client';

export function mergeClients(...clients: SearchClient[]): SearchClient {
  return {
    deps: clients.flatMap((client) => client.deps ?? []),
    async search(query) {
      const lists = await Promise.all(
        clients.map((client) => client.search(query)),
      );
      const seen = new Set<string>();
      const out = [];
      for (const list of lists) {
        for (const hit of list) {
          if (seen.has(hit.id)) continue;
          seen.add(hit.id);
          out.push(hit);
        }
      }
      return out;
    },
  };
}

