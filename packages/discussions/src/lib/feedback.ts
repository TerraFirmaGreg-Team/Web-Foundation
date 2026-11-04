'use server';
import { githubAppToken } from '@terrafirmagreg-team/data';
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
  const seg = pathname.split('/').find((part) => part in datasets);
  const cfg = (seg && datasets[seg]) || datasets.dev;
  if (!cfg?.repo || !cfg.discussions) return undefined;
  return {
    repo: cfg.repo,
    repoId: cfg.discussions.repoId,
    categoryId: cfg.discussions.categoryId,
    category: 'General',
  };
}

export async function onPageFeedbackAction(
  feedback: PageFeedback,
): Promise<ActionResponse> {
  feedback = pageFeedback.parse(feedback);
  const { pathname } = new URL(feedback.url);

  return createDiscussionThread(
    pathname,
    `[${feedback.opinion}] ${feedback.message}\n\n> Forwarded from user feedback.`,
  );
}

export async function onBlockFeedbackAction(
  feedback: BlockFeedback,
): Promise<ActionResponse> {
  feedback = blockFeedback.parse(feedback);
  const url = new URL(feedback.url);
  url.hash = feedback.blockId;

  return createDiscussionThread(
    url.pathname,
    `> ${feedback.blockBody}\n\n${feedback.message}\n\n> [Forwarded from user feedback](${url.href}).`,
  );
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

