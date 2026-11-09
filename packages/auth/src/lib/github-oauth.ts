import * as oauth from 'oauth4webapi';

const server: oauth.AuthorizationServer = {
  issuer: 'https://github.com',
  authorization_endpoint: 'https://github.com/login/oauth/authorize',
  token_endpoint: 'https://github.com/login/oauth/access_token',
};

export interface GitHubOAuth {
  createAuthorizationURL(state: string, scopes: string[]): URL;
  validateAuthorizationCode(code: string): Promise<string>;
}

export function createGitHubOAuth(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): GitHubOAuth {
  const client: oauth.Client = { client_id: clientId };
  const auth = oauth.ClientSecretPost(clientSecret);
  return {
    createAuthorizationURL(state, scopes) {
      const url = new URL(server.authorization_endpoint!);
      url.searchParams.set('client_id', clientId);
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('state', state);
      if (scopes.length > 0) url.searchParams.set('scope', scopes.join(' '));
      return url;
    },
    async validateAuthorizationCode(code) {
      const res = await oauth.authorizationCodeGrantRequest(
        server,
        client,
        auth,
        new URLSearchParams({ code }),
        redirectUri,
        oauth.nopkce,
      );
      const tokens = await oauth.processAuthorizationCodeResponse(
        server,
        client,
        res,
      );
      return tokens.access_token;
    },
  };
}
