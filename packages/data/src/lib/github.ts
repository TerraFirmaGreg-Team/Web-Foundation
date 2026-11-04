const GITHUB_API = 'https://api.github.com';

export interface GithubFetchOptions {
  token?: string;

  timeoutMs?: number;
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
}

export function githubHeaders(token?: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function githubFetch(
  path: `/${string}`,
  options: GithubFetchOptions = {},
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    method: options.method,
    body: options.body,
    redirect: 'error',
    headers: { ...githubHeaders(options.token), ...options.headers },
    signal: options.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
  });
}

export async function githubGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
  options: Pick<GithubFetchOptions, 'token'> & { userAgent?: string },
): Promise<T> {
  const res = await fetch(`${GITHUB_API}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.token}`,
      'Content-Type': 'application/json',
      'User-Agent': options.userAgent ?? '@terrafirmagreg-team/data',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) throw new Error('GitHub GraphQL: empty response');
  return json.data;
}

