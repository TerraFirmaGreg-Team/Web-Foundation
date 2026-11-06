import { listGuideBooks } from '@terrafirmagreg-team/guide/lib/book/list';
import { loadClientGuideBook } from '@terrafirmagreg-team/guide/lib/client/books';
import { loadClientGuidePayload } from '@terrafirmagreg-team/guide/lib/client/payload';

export function getGuideSource() {
  return {
    books: listGuideBooks,
    book: loadClientGuideBook,
    payload: loadClientGuidePayload,
  };
}

export type GuideSource = ReturnType<typeof getGuideSource>;
