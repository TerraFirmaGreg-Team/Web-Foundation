import { env } from '@terrafirmagreg-team/data';

export type AuthMode = 'dev' | 'github';
export const authCookie = 'fcgd_token';
export const devAuthCookie = 'fc_dev_user';

export function authMode(): AuthMode {
  const mode = env('COMMENTS_AUTH');
  if (mode) return mode === 'dev' ? 'dev' : 'github';
  return process.env.NODE_ENV === 'development' ? 'dev' : 'github';
}

export function authEnabled() {
  if (authMode() === 'dev') return true;
  return Boolean(env('DISCUSSIONS_SECRET') && env('APP_CLIENT_ID'));
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  tokenSecret: string;
  cookieName: string;
  devCookieName: string;
  callbackPath: string;
  loginPath: string;
  scope: string;
  mode: AuthMode;
}

export function authConfig(): AuthConfig {
  return {
    clientId: env('APP_CLIENT_ID')!,
    clientSecret: env('APP_SECRET')!,
    tokenSecret: env('DISCUSSIONS_SECRET') ?? 'dev-token-secret',
    cookieName: authCookie,
    devCookieName: devAuthCookie,
    callbackPath: '/api/comments/oauth/callback',
    loginPath: '/api/comments/oauth/login',
    scope: '',
    mode: authMode(),
  };
}

