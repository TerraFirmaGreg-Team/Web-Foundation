import { listGuideBooks } from '@terrafirmagreg-team/guide/lib/books';
import { loadClientGuideBook } from '@terrafirmagreg-team/guide/lib/client/guides';
import { loadClientGuidePayload } from '@terrafirmagreg-team/guide/lib/client-payload';

export function getGuideSource() {
  return {
    books: listGuideBooks,
    book: loadClientGuideBook,
    payload: loadClientGuidePayload,
  };
}

export type GuideSource = ReturnType<typeof getGuideSource>;
