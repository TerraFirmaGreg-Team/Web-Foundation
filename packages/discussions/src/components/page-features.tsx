import 'server-only';
import { FeedbackText } from './feedback/block';
import { Feedback } from './feedback/page';
import { Comments } from './comments-view';
import { feedbackEnabled } from '../lib/comments/server';
import {
  onBlockFeedbackAction,
  onPageFeedbackAction,
} from '../lib/feedback';
import type { ReactNode } from 'react';

export function PageBodyFeatures({ children }: { children: ReactNode }) {
  const body = (
    <div data-md-root className="contents">
      {children}
    </div>
  );
  return feedbackEnabled() ? (
    <FeedbackText onSendAction={onBlockFeedbackAction}>
      {body}
    </FeedbackText>
  ) : (
    body
  );
}

export function PageFooterFeedback() {
  return feedbackEnabled() ? (
    <Feedback onSendAction={onPageFeedbackAction} />
  ) : null;
}

export function PageComments() {
  return <Comments />;
}
