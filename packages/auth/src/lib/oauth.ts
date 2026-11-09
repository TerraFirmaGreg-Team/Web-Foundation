import { decrypt, encrypt } from '@terrafirmagreg-team/data';
import { createGitHubOAuth, type GitHubOAuth } from './github-oauth';
import type { AuthConfig } from './config';

const STATE_TTL = 10 * 60 * 1000;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_BASE = 'Path=/; Max-Age=%d; SameSite=Lax; HttpOnly; Secure';
const DEV_NAME_MAX = 40;

export interface OAuthFlow {
  login(request: Request): Response;
  devLogin(request: Request): Promise<Response>;
  callback(request: Request): Promise<Response>;
  logout(request: Request): Response;
}

function sameOrigin(candidate: string | null, self: string): string {
  if (!candidate) return `${self}/`;
  try {
    const parsed = new URL(candidate, self);
    return parsed.origin === self ? parsed.href : `${self}/`;
  } catch {
    return `${self}/`;
  }
}

function setCookieHeader(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; ${COOKIE_BASE.replace('%d', String(maxAge))}`;
}

function encodeState(returnUrl: string, secret: string) {
  return encrypt(
    JSON.stringify({ r: returnUrl, e: Date.now() + STATE_TTL }),
    secret,
  );
}

function decodeState(state: string, secret: string): string {
  const payload = JSON.parse(decrypt(state, secret)) as { r?: unknown; e?: unknown };
  if (typeof payload.e !== 'number' || Date.now() > payload.e)
    throw new Error('expired');
  if (typeof payload.r !== 'string') throw new Error('invalid');
  return payload.r;
}

function devName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value
    .replace(/[^\p{L}\p{N} _.\-]/gu, '')
    .trim()
    .slice(0, DEV_NAME_MAX);
  return name || null;
}

function devLoginForm(request: Request, config: AuthConfig): Response {
  const self = new URL(request.url).origin;
  const returnUrl = sameOrigin(new URL(request.url).searchParams.get('return'), self);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in</title><style>
:root{color-scheme:light dark;font-family:ui-sans-serif,system-ui,sans-serif}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:light-dark(#fafafa,#0a0a0a);color:light-dark(#171717,#ededed)}
form{display:flex;flex-direction:column;gap:12px;min-width:280px;padding:28px;border:1px solid light-dark(#e5e5e5,#262626);border-radius:16px;background:light-dark(#fff,#141414);box-shadow:0 1px 2px rgb(0 0 0/.05)}
h1{font-size:20px;font-weight:600;margin:0 0 4px}
input,button{font:inherit;padding:8px 12px;border-radius:8px;border:1px solid light-dark(#e5e5e5,#262626);background:transparent;color:inherit}
input:focus-visible{outline:2px solid light-dark(#171717,#ededed);outline-offset:2px}
button{background:light-dark(#171717,#ededed);color:light-dark(#fafafa,#0a0a0a);border:0;font-weight:500;cursor:pointer}
button:hover{opacity:.85}
</style></head><body>
<form method="post" action="${config.loginPath}">
<h1>Sign in to comment</h1>
<input name="name" required maxlength="${DEV_NAME_MAX}" placeholder="Display name" autocomplete="username" />
<input type="hidden" name="return" value="${returnUrl.replaceAll('"', '&quot;')}" />
<button type="submit">Sign in</button>
</form></body></html>`;
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

export function createOAuthFlow(getConfig: () => AuthConfig): OAuthFlow {
  function github(config: AuthConfig, self: string): GitHubOAuth {
    return createGitHubOAuth(
      config.clientId,
      config.clientSecret,
      `${self}${config.callbackPath}`,
    );
  }

  function login(request: Request): Response {
    const config = getConfig();
    if (config.mode === 'dev') return devLoginForm(request, config);
    const self = new URL(request.url).origin;
    const returnUrl = sameOrigin(new URL(request.url).searchParams.get('return'), self);
    const url = github(config, self).createAuthorizationURL(
      encodeState(returnUrl, config.tokenSecret),
      config.scope.split(' ').filter(Boolean),
    );
    return Response.redirect(url, 302);
  }

  async function devLogin(request: Request): Promise<Response> {
    const config = getConfig();
    if (config.mode !== 'dev')
      return Response.json({ message: 'Dev auth disabled' }, { status: 404 });
    const form = await request.formData();
    const name = devName(form.get('name'));
    const self = new URL(request.url).origin;
    const returnUrl = sameOrigin(
      typeof form.get('return') === 'string' ? (form.get('return') as string) : null,
      self,
    );
    if (!name)
      return Response.json({ message: 'Invalid name' }, { status: 400 });
    return new Response(null, {
      status: 302,
      headers: {
        location: returnUrl,
        'set-cookie': setCookieHeader(config.devCookieName, name, COOKIE_MAX_AGE),
      },
    });
  }

  async function callback(request: Request): Promise<Response> {
    const config = getConfig();
    const url = new URL(request.url);
    const self = url.origin;
    let returnUrl = `${self}/`;
    const state = url.searchParams.get('state');
    if (state) {
      try {
        returnUrl = decodeState(state, config.tokenSecret);
      } catch {
        return Response.json(
          { message: 'Invalid or expired sign-in state' },
          { status: 400 },
        );
      }
    }
    const code = url.searchParams.get('code');
    if (url.searchParams.get('error') || !code)
      return Response.redirect(returnUrl, 302);
    try {
      const accessToken = await github(config, self).validateAuthorizationCode(
        code,
      );
      return new Response(null, {
        status: 302,
        headers: {
          location: returnUrl,
          'set-cookie': setCookieHeader(
            config.cookieName,
            encrypt(accessToken, config.tokenSecret),
            COOKIE_MAX_AGE,
          ),
        },
      });
    } catch {
      return Response.json({ message: 'GitHub sign-in failed' }, { status: 502 });
    }
  }

  function logout(request: Request): Response {
    const config = getConfig();
    const self = new URL(request.url).origin;
    const returnUrl = sameOrigin(new URL(request.url).searchParams.get('return'), self);
    return new Response(null, {
      status: 302,
      headers: [
        ['location', returnUrl],
        ['set-cookie', setCookieHeader(config.cookieName, '', 0)],
        ['set-cookie', setCookieHeader(config.devCookieName, '', 0)],
      ],
    });
  }

  return { login, devLogin, callback, logout };
}

