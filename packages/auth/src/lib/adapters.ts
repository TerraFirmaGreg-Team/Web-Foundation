import {
  githubFetch,
  parseCookies,
  readTokenFromCookieHeader,
} from '@terrafirmagreg-team/data';

export type Awaitable<T> = T | Promise<T>;

export interface CookieRequest {
  headers: {
    get(key: string): string | readonly string[] | null | undefined;
  };
}

export interface CookieSession {
  id: string;
}

export interface SessionAdapter<R extends CookieRequest = CookieRequest> {
  getSession(request: R): Awaitable<CookieSession | null>;
}

const headerValue = (value: string | readonly string[] | null | undefined) =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

export function githubCookieAuth({
  cookieName,
  tokenSecret,
}: {
  cookieName: string;
  tokenSecret: string;
}): SessionAdapter {
  const cache = new Map<string, Promise<CookieSession | null>>();
  return {
    getSession(request) {
      const token = readTokenFromCookieHeader(
        headerValue(request.headers.get('cookie')),
        cookieName,
        tokenSecret,
      );
      if (!token) return null;
      let session = cache.get(token);
      if (!session) {
        session = githubFetch('/user', { token })
          .then(async (res) =>
            res.ok ? { id: ((await res.json()) as { login: string }).login } : null,
          )
          .catch(() => null);
        cache.set(token, session);
        session.then((s) => {
          if (!s && cache.get(token) === session) cache.delete(token);
        });
      }
      return session;
    },
  };
}

export function devCookieAuth({
  cookieName,
}: {
  cookieName: string;
}): SessionAdapter {
  return {
    getSession(request) {
      const name = parseCookies(
        headerValue(request.headers.get('cookie')),
      )[cookieName]?.trim();
      return name ? { id: name } : null;
    },
  };
}

