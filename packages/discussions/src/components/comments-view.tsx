'use client';

import { Comments as FumaComments } from '@fuma-comment/react';
import { useCommentsEnabled } from '../hooks/comments/use-enabled';
import { usePageThread } from '../hooks/comments/use-thread';
import { redirectToCommentsLogin } from '../lib/comments/auth';

export function Comments({
  page,
  apiUrl = '/api/comments',
}: {
  page?: string;
  apiUrl?: string;
}) {
  const enabled = useCommentsEnabled(`${apiUrl}/config`);
  const thread = usePageThread(page);
  if (!enabled) return null;
  return (
    <div className="not-prose mt-8">
      <FumaComments
        page={thread}
        apiUrl={apiUrl}
        auth={{
          type: 'api',
          signIn: () => redirectToCommentsLogin(apiUrl),
        }}
        mention={{ enabled: true }}
      />
    </div>
  );
}

