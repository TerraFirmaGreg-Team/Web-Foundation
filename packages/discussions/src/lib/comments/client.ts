'use client';
import type { AuthInfoWithRole } from '@fuma-comment/server';

export type CommentsClient = ReturnType<typeof createCommentsClient>;

export function createCommentsClient(apiUrl = '/api/comments') {
  async function fetcher<T = void>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      const message = await response.text();
      let err = new Error(message);
      try {
        const obj = JSON.parse(message) as object;
        if ('message' in obj && typeof obj.message === 'string') {
          err = new Error(obj.message);
        }
      } catch {}
      throw err;
    }
    return (await response.json()) as T;
  }

  return {
    getAuthSession(options: { page: string }): Promise<AuthInfoWithRole> {
      return fetcher(`${apiUrl}/${options.page}/auth`);
    },
  };
}

