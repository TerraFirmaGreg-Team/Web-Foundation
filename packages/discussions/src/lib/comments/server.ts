import 'server-only';
import { NextComment } from '@fuma-comment/server/next';
type RouteRequest = Request & { nextUrl: { pathname: string } };
import {
  authConfig,
  authCookie,
  authEnabled,
  commentsMode,
  devAuthCookie,
  devCookieAuth,
} from '@terrafirmagreg-team/auth';
import { env, featureMode, githubAppToken } from '@terrafirmagreg-team/data';
import {
  createAuth,
  createGitHubClient,
  createStorage,
  type GitHubDiscussionsConfig,
} from 'fuma-comment-github-discussions';
import { discussionsConfig } from '../config';
import { createDiscussion } from './github';
import { localComments, readonlyComments } from './local';

const APP_TOKEN = 'app';
const CATEGORY = 'General';

type DiscussionTarget = {
  dataset: string;
  repo: string;
  repoId: string;
  categoryId: string;
};

function datasets(): DiscussionTarget[] {
  return Object.entries(discussionsConfig().datasets).flatMap(
    ([dataset, cfg]) =>
      cfg.repo && cfg.discussions
        ? [
            {
              dataset,
              repo: cfg.repo,
              repoId: cfg.discussions.repoId,
              categoryId: cfg.discussions.categoryId,
            },
          ]
        : [],
  );
}

function datasetSegs(): Set<string> {
  return new Set(datasets().map(({ dataset }) => dataset));
}

function defaultDataset(): DiscussionTarget {
  return datasets().find(({ dataset }) => dataset === 'dev')!;
}

function datasetOf(page: string) {
  const segs = datasetSegs();
  const seg = page.split('~').find((part) => segs.has(part));
  return datasets().find(({ dataset }) => dataset === seg) ?? defaultDataset();
}

function pageToTitle(page: string): string {
  const locales = new Set(discussionsConfig().knownLanguages ?? []);
  const segs = datasetSegs();
  const pretty = page
    .split('~')
    .slice(0, -1)
    .filter((seg) => seg && !locales.has(seg) && !segs.has(seg))
    .map((seg) =>
      seg.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
    );
  return pretty.join(' › ') || 'Page';
}

type Client = ReturnType<typeof createGitHubClient>;
type Storage = ReturnType<typeof createStorage>;

let siteUrl: string | undefined;

function currentSiteUrl(): string {
  return siteUrl ?? discussionsConfig().siteUrl;
}
const storages = new Map<string, Storage>();

function cfgFor(d: DiscussionTarget): GitHubDiscussionsConfig {
  return {
    repo: d.repo,
    repoId: d.repoId,
    categoryId: d.categoryId,
    category: CATEGORY,
    readToken: APP_TOKEN,
    tokenSecret: authConfig().tokenSecret,
    cookieName: authCookie,
    pageToTitle,
    pageToUrl: (page) => {
      const segs = page.split('~');
      segs.pop();
      return `${currentSiteUrl()}/${segs.filter(Boolean).join('/')}`;
    },
  };
}

function wrapClient(d: DiscussionTarget, cfg: GitHubDiscussionsConfig): Client {
  const base = createGitHubClient(cfg);
  const wrapped = { ...base };
  for (const key of Object.keys(base) as (keyof Client)[]) {
    const fn = base[key] as (...args: unknown[]) => unknown;
    (wrapped as Record<string, unknown>)[key] = async (...args: unknown[]) => {
      if (args.includes(APP_TOKEN)) {
        const token = await githubAppToken(d.repo);
        args = args.map((arg) => (arg === APP_TOKEN ? token : arg));
      }
      return fn(...args);
    };
  }
  wrapped.createDiscussion = async (title, url, token) => {
    const resolved = token === APP_TOKEN ? await githubAppToken(d.repo) : token;
    return createDiscussion(cfg, title, url, resolved);
  };
  return wrapped;
}

function storageFor(d: DiscussionTarget): Storage {
  let storage = storages.get(d.dataset);
  if (!storage) {
    const cfg = cfgFor(d);
    storage = createStorage(cfg, wrapClient(d, cfg));
    storages.set(d.dataset, storage);
  }
  return storage;
}

type RouteHandler = (
  req: RouteRequest,
  context: { params: Promise<{ comment: string[] }> },
) => Promise<Response>;

export function commentsEnabled(): boolean {
  const mode = commentsMode();
  if (mode === 'off' || datasets().length === 0) return false;
  if (mode === 'dev') return true;
  return authEnabled() && Boolean(env('APP_ID') && env('APP_PRIVATE_KEY'));
}

export function feedbackEnabled(): boolean {
  const mode = featureMode('FEEDBACK');
  if (mode === 'off') return false;
  if (mode === 'dev') return true;
  return datasets().length > 0 && Boolean(env('APP_ID') && env('APP_PRIVATE_KEY'));
}

export function createCommentsRouter(
  options: { siteUrl?: string } = {},
): {
  GET: RouteHandler;
  POST: RouteHandler;
  PATCH: RouteHandler;
  DELETE: RouteHandler;
} {
  siteUrl = options.siteUrl ?? discussionsConfig().siteUrl;
  const mode = commentsMode();
  const keys = Boolean(env('APP_ID') && env('APP_PRIVATE_KEY'));

  const local = (storage = localComments()) =>
    NextComment({
      role: 'database',
      mention: { enabled: true },
      storage,
      auth: devCookieAuth({ cookieName: devAuthCookie }),
    }) as unknown as {
      GET: RouteHandler;
      POST: RouteHandler;
      PATCH: RouteHandler;
      DELETE: RouteHandler;
    };

  if (mode === 'off') return local(readonlyComments());
  if (mode === 'dev' || !keys) return local();
  if (!(datasets().length > 0 && authEnabled())) return local(readonlyComments());

  const dispatch = (page: string | undefined) =>
    storageFor(datasetOf(page ?? ''));

  const storage = {
    getComments: (args: Parameters<Storage['getComments']>[0]) =>
      dispatch(args.page as string | undefined).getComments(args),
    postComment: (args: Parameters<Storage['postComment']>[0]) =>
      dispatch(args.page as string | undefined).postComment(args),
    updateComment: (args: Parameters<Storage['updateComment']>[0]) =>
      dispatch(args.page).updateComment(args),
    deleteComment: (args: Parameters<Storage['deleteComment']>[0]) =>
      dispatch(args.page).deleteComment(args),
    setRate: (args: Parameters<Storage['setRate']>[0]) =>
      dispatch(args.page).setRate(args),
    deleteRate: (args: Parameters<Storage['deleteRate']>[0]) =>
      dispatch(args.page).deleteRate(args),
    getCommentAuthor: async (
      args: Parameters<Storage['getCommentAuthor']>[0],
    ) => {
      for (const d of datasets()) {
        const author = await Promise.resolve(
          storageFor(d).getCommentAuthor(args),
        ).catch(() => null);
        if (author) return author;
      }
      return null;
    },
    getRole: (args: Parameters<Storage['getRole']>[0]) =>
      storageFor(datasetOf(args.page)).getRole(args),
    queryUsers: (args: Parameters<NonNullable<Storage['queryUsers']>>[0]) =>
      dispatch(args.page).queryUsers?.(args) ?? [],
  } as Storage;

  const cfg = cfgFor(defaultDataset());
  return NextComment({
    role: 'database',
    mention: { enabled: true },
    storage,
    auth: createAuth(cfg, wrapClient(defaultDataset(), cfg)),
  }) as unknown as { GET: RouteHandler; POST: RouteHandler; PATCH: RouteHandler; DELETE: RouteHandler };
}

