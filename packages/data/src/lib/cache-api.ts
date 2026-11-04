import 'server-only';

export async function cachedResponse(
  _req: Request,
  ttl: number,
  load: () => Promise<Response>,
): Promise<Response> {
  const res = await load();
  if (!res.ok) return res;
  const headers = new Headers(res.headers);
  headers.set(
    'Cache-Control',
    `public, s-maxage=${ttl}, stale-while-revalidate=${ttl}`,
  );
  return new Response(res.body, { status: res.status, headers });
}

