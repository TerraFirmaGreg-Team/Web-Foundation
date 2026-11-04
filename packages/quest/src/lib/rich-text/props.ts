export function splitProperties(input: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const token of input.split(' ')) {
    if (!token) continue;
    const colon = token.indexOf(':');
    if (colon === -1) {
      map[token] = '';
    } else {
      map[token.slice(0, colon)] = token.slice(colon + 1).replaceAll('%20', ' ');
    }
  }
  return map;
}

