export {
  authConfig,
  authEnabled,
  authMode,
  authCookie,
  devAuthCookie,
  type AuthConfig,
  type AuthMode,
} from './config';
export { createOAuthFlow, type OAuthFlow } from './oauth';
export {
  devCookieAuth,
  githubCookieAuth,
  type CookieRequest,
  type CookieSession,
  type SessionAdapter,
} from './adapters';

import { createOAuthFlow } from './oauth';
import { authConfig } from './config';

const flow = createOAuthFlow(authConfig);

export const { login, callback, logout, devLogin } = flow;

