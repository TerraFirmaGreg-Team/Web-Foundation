'use server';
import {
  env,
  featureMode,
  githubAppToken,
  jsonFileStore,
} from '@terrafirmagreg-team/data';
import { createGitHubClient } from 'fuma-comment-github-discussions';
import { discussionsConfig } from './config';
import { createDiscussion } from './comments/github';
import {
  blockFeedback,
  pageFeedback,
  type ActionResponse,
  type BlockFeedback,
  type PageFeedback,
} from './feedback-schema';

function targetOf(pathname: string) {
  const datasets = discussionsConfig().datasets;
  const seg = pathname
    .split(/[?#]/)[0]
    .split('/')
    .find((part) => part in datasets);
  const cfg = (seg && datasets[seg]) || datasets.dev;
  if (!cfg?.repo || !cfg.discussions) return undefined;
  return {
    repo: cfg.repo,
    repoId: cfg.discussions.repoId,
    categoryId: cfg.discussions.categoryId,
    category: 'General',
  };
}

const FILE = env('FEEDBACK_DATA') ?? 'data/feedback.json';
const store = jsonFileStore<unknown[]>(FILE, () => []);

function pagePath(url: string): string {
  const u = new URL(url);
  return u.pathname + u.search;
}

export async function onPageFeedbackAction(
  feedback: PageFeedback,
): Promise<ActionResponse> {
  feedback = pageFeedback.parse(feedback);
  const page = pagePath(feedback.url);
  if (featureMode('FEEDBACK') === 'dev')
    return storeFeedback({ kind: 'page', ...feedback, url: page });

  return createDiscussionThread(
    page,
    `${feedback.opinion === 'good' ? '👍' : '👎'} ${feedback.message}\n\n> Forwarded from user feedback.`,
  );
}

export async function onBlockFeedbackAction(
  feedback: BlockFeedback,
): Promise<ActionResponse> {
  feedback = blockFeedback.parse(feedback);
  const page = pagePath(feedback.url);
  if (featureMode('FEEDBACK') === 'dev')
    return storeFeedback({
      kind: 'block',
      ...feedback,
      url: `${page}#${feedback.blockId}`,
    });

  return createDiscussionThread(
    page,
    `> ${feedback.blockBody}\n\n${feedback.message}\n\n> [Forwarded from user feedback](${discussionsConfig().siteUrl}${page}#${feedback.blockId}).`,
  );
}

function storeFeedback(entry: Record<string, unknown>): ActionResponse {
  store.data.push({ ...entry, at: Date.now() });
  store.save();
  return { githubUrl: '' };
}

async function createDiscussionThread(
  pageId: string,
  body: string,
): Promise<ActionResponse> {
  const target = targetOf(pageId);
  if (!target) return { githubUrl: '' };
  const github = createGitHubClient(target);
  const auth = await githubAppToken(target.repo);
  const title = `Feedback for ${pageId}`;

  const discussion =
    (await github.findDiscussion(title, auth)) ??
    (await createDiscussion(
      target,
      title,
      `${discussionsConfig().siteUrl}${pageId}`,
      auth,
    ));
  await github.addComment(discussion.id, body, auth);

  return { githubUrl: discussion.url };
}

