'use client';

import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import type { AuthInfoWithRole } from '@fuma-comment/server';
import { createCommentsClient } from '../../lib/comments/client';
import { usePageThread } from './use-thread';

export function useCommentsSession(
  apiUrl = '/api/comments',
  options?: { page?: string; enabled?: boolean },
): { session: AuthInfoWithRole | null; isLoading: boolean } {
  const thread = usePageThread(options?.page);
  const client = useMemo(() => createCommentsClient(apiUrl), [apiUrl]);
  const query = useSWRImmutable(
    (options?.enabled ?? true) ? ['comments-session', thread] : null,
    () => client.getAuthSession({ page: thread }).catch(() => null),
  );
  return { session: query.data ?? null, isLoading: query.isLoading };
}

