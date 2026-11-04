import 'server-only';
import { githubGraphql } from '@terrafirmagreg-team/data';
import type { GDiscussion } from 'fuma-comment-github-discussions';

const CREATE_DISCUSSION = `
  mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(
      input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }
    ) {
      discussion { id url }
    }
  }`;

export async function createDiscussion(
  target: { repoId: string; categoryId: string },
  title: string,
  url: string | undefined,
  token: string,
): Promise<GDiscussion> {
  const link = url ? ` ([${title}](${url}))` : '';
  const data = await githubGraphql<{
    createDiscussion: { discussion: { id: string; url: string } };
  }>(
    CREATE_DISCUSSION,
    {
      repositoryId: target.repoId,
      categoryId: target.categoryId,
      title,
      body: `Comment thread for \`${title}\`${link}.`,
    },
    { token },
  );
  return data.createDiscussion.discussion as GDiscussion;
}

