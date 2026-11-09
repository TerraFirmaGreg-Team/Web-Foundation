'use client';

import { useMemo } from 'react';
import { Comments as FumaComments } from '@fuma-comment/react';
import { useCommentsEnabled } from '../hooks/comments/use-enabled';
import { usePageThread } from '../hooks/comments/use-thread';
import { redirectToCommentsLogin } from '../lib/comments/auth';
import { stubCommentsApi } from '../lib/comments/offline';

export function Comments({
  page,
  apiUrl = '/api/comments',
}: {
  page?: string;
  apiUrl?: string;
}) {
  const enabled = useCommentsEnabled(`${apiUrl}/config`);
  const thread = usePageThread(page);
  useMemo(() => {
    if (enabled === false) stubCommentsApi(apiUrl);
  }, [enabled, apiUrl]);
  if (enabled === null) return null;
  return (
    <div
      className={
        enabled
          ? 'not-prose mt-8'
          : 'not-prose mt-8 pointer-events-none select-none opacity-50'
      }
      aria-disabled={!enabled || undefined}
    >
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
