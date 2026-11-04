import { commentsView, type CommentsViewProps } from '../lib/comments';

export function CommentsSlot(props: CommentsViewProps) {
  const View = commentsView();
  // eslint-disable-next-line react-hooks/static-components
  return View ? <View {...props} /> : null;
}

