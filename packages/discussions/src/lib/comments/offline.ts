'use client';

let stubbed = false;

export function stubCommentsApi(apiUrl: string): void {
  if (stubbed) return;
  stubbed = true;
  const original = window.fetch;
  const respond = (body: unknown, status = 200) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  window.fetch = (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    const { pathname } = new URL(url, location.origin);
    if (!pathname.startsWith(apiUrl))
      return original.call(window, input, init);
    if (init?.method && init.method !== 'GET')
      return respond({ message: 'Comments disabled' }, 403);
    if (pathname === `${apiUrl}/config`) return respond({ enabled: false });
    if (pathname.endsWith('/auth')) return respond(null);
    return respond([]);
  };
}
