'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  type SyntheticEvent,
  useState,
  useTransition,
} from 'react';
import { Collapsible, CollapsibleContent } from '@terrafirmagreg-team/ui/components/ui/collapsible';
import { cva } from 'class-variance-authority';
import {
  actionResponse,
  pageFeedback,
  type ActionResponse,
  type PageFeedback,
} from '../../lib/feedback-schema';
import { z } from 'zod/mini';
import { usePathname } from 'next/navigation';
import { useLocationSearch } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useSubmissionStorage } from '../../hooks/feedback/use-submission-storage';

const rateButtonVariants = cva(
  'inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium border text-sm [&_svg]:size-4 disabled:cursor-not-allowed',
  {
    variants: {
      active: {
        true: 'bg-fd-accent text-fd-accent-foreground [&_svg]:fill-current',
        false: 'text-fd-muted-foreground',
      },
    },
  },
);

const pageFeedbackResult = z.extend(pageFeedback, {
  response: actionResponse,
});

export function Feedback({
  onSendAction,
  disabled,
}: {
  onSendAction: (feedback: PageFeedback) => Promise<ActionResponse>;
  disabled?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const search = useLocationSearch();
  const pageId = search ? `${pathname}?${search}` : pathname;
  const { previous, setPrevious } = useSubmissionStorage(pageId, (v) => {
    const result = pageFeedbackResult.safeParse(v);
    return result.success ? result.data : null;
  });
  const [opinion, setOpinion] = useState<'good' | 'bad' | null>(null);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(e?: SyntheticEvent) {
    if (disabled || opinion == null) return;

    startTransition(async () => {
      const feedback: PageFeedback = {
        url: location.href,
        opinion: opinion!,
        message,
      };

      const response = await onSendAction(feedback);
      setPrevious({
        response,
        ...feedback,
      });
      setMessage('');
      setOpinion(null);
    });

    e?.preventDefault();
  }

  const activeOpinion = previous?.opinion ?? opinion;

  return (
    <Collapsible
      open={opinion !== null || previous !== null}
      onOpenChange={(v) => {
        if (!v) setOpinion(null);
      }}
      className="border-y py-3"
    >
      <div
        className={cn(
          'flex flex-row items-center gap-2',
          disabled && 'opacity-50',
        )}
      >
        <p className="text-sm font-medium pe-2">{t('How is this page?', { note: 'ui.feedback.question' })}</p>
        <button
          disabled={disabled || previous !== null}
          className={cn(
            rateButtonVariants({
              active: activeOpinion === 'good',
            }),
          )}
          onClick={() => {
            setOpinion('good');
          }}
        >
          <ThumbsUp />
          {t('Good', { note: 'ui.feedback.good' })}
        </button>
        <button
          disabled={disabled || previous !== null}
          className={cn(
            rateButtonVariants({
              active: activeOpinion === 'bad',
            }),
          )}
          onClick={() => {
            setOpinion('bad');
          }}
        >
          <ThumbsDown />
          {t('Bad', { note: 'ui.feedback.bad' })}
        </button>
      </div>
      <CollapsibleContent className="mt-3">
        {previous ? (
          <div className="px-3 py-6 flex flex-col items-center gap-3 bg-fd-card text-fd-muted-foreground text-sm text-center rounded-xl">
            <p>{t('Thank you for your feedback!', { note: 'ui.feedback.thanks' })}</p>
            <div className="flex flex-row items-center gap-2">
              <a
                href={previous.response?.githubUrl}
                rel="noreferrer noopener"
                target="_blank"
                className={cn(
                  buttonVariants({
                    variant: 'default',
                  }),
                  'text-xs',
                )}
              >
                {t('View on GitHub', { note: 'ui.feedback.view_on_github' })}
              </a>

              <button
                className={cn(
                  buttonVariants({
                    variant: 'secondary',
                  }),
                  'text-xs',
                )}
                onClick={() => {
                  setOpinion(previous.opinion);
                  setPrevious(null);
                }}
              >
                {t('Submit Again', { note: 'ui.feedback.submit_again' })}
              </button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <textarea
              autoFocus
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border rounded-lg bg-fd-secondary text-fd-secondary-foreground p-3 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-fd-muted-foreground"
              placeholder={t('Leave your feedback…', { note: 'ui.feedback.placeholder' })}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (!e.shiftKey && e.key === 'Enter') {
                  submit(e);
                }
              }}
            />
            <button
              type="submit"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-fit px-3')}
              disabled={isPending}
            >
              {t('Submit', { note: 'ui.feedback.submit' })}
            </button>
          </form>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

