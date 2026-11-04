import 'server-only';
import { getView, incrementView } from './store';

const MAX_PATH_LEN = 500;

function normalizePath(path: string): string {
  const clean = path.split(/[?#]/)[0] ?? '';
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

export function createAnalyticsRouter() {
  return {
    async POST(req: Request): Promise<Response> {
      const body = (await req.json().catch(() => null)) as {
        path?: unknown;
        views?: unknown;
      } | null;
      const list = Array.isArray(body?.views)
        ? body.views
        : typeof body?.path === 'string'
          ? [body.path]
          : null;
      const paths = list?.filter(
        (p): p is string =>
          typeof p === 'string' && p.startsWith('/') && p.length <= MAX_PATH_LEN,
      );
      if (!paths?.length || paths.length > 50)
        return Response.json({ error: 'invalid path' }, { status: 400 });
      for (const path of paths) await incrementView(normalizePath(path));
      return Response.json({ ok: true });
    },

    async GET(req: Request): Promise<Response> {
      const path = new URL(req.url).searchParams.get('path');
      if (!path || !path.startsWith('/'))
        return Response.json({ error: 'invalid path' }, { status: 400 });
      return Response.json({ views: await getView(normalizePath(path)) });
    },
  };
}

