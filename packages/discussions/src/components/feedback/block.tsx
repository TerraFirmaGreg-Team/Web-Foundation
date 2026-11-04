'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { injectHighlightStyle } from '@terrafirmagreg-team/ui/lib/utils/highlight-style';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { CornerDownRightIcon } from 'lucide-react';
import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  actionResponse,
  blockFeedback,
  type ActionResponse,
  type BlockFeedback,
} from '../../lib/feedback-schema';
import { z } from 'zod/mini';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useSubmissionStorage } from '../../hooks/feedback/use-submission-storage';

const blockFeedbackResult = z.extend(blockFeedback, {
  response: actionResponse,
});

export interface FeedbackTextProps {
  onSendAction: (feedback: BlockFeedback) => Promise<ActionResponse>;
  children?: ReactNode;
}

export function FeedbackText({ onSendAction, children }: FeedbackTextProps) {
  const [popup, _setPopup] = useState<{
    mode: 'tooltip' | 'expanded';
    blockId: string;
    selection: string;
    range: Range;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { refs, floatingStyles } = useFloating({
    open: popup !== null,
    placement: 'bottom',
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  function expandPopup() {
    if (popup?.mode !== 'tooltip') return;

    const highlight = new Highlight(popup.range);
    CSS.highlights.set('fd-feedback-text', highlight);
    injectHighlightStyle(
      'fd-feedback-text',
      'background-color:var(--color-fd-primary);color:var(--color-fd-primary-foreground)',
    );

    _setPopup({ ...popup, mode: 'expanded' });
  }

  function closePopup() {
    if (popup?.mode === 'expanded') {
      CSS.highlights.delete('fd-feedback-text');
    }

    _setPopup(null);
  }

  const updateSelectionPopover = useEffectEvent(() => {
    if (popup && popup.mode === 'expanded') return;

    const container = containerRef.current;
    const selection = window.getSelection();

    if (!container || !selection || selection.isCollapsed || selection.rangeCount === 0) {
      closePopup();
      return;
    }

    const range = selection.getRangeAt(0).cloneRange();
    if (!container.contains(range.commonAncestorContainer)) {
      closePopup();
      return;
    }

    const selectionText = selection.toString().trim();
    if (selectionText.length === 0 || selectionText.includes('\n')) {
      closePopup();
      return;
    }

    const element =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    const blockId = element?.closest('[data-block="feedback"]')?.id;
    if (!blockId) {
      closePopup();
      return;
    }

    refs.setReference({
      getBoundingClientRect() {
        return range.getBoundingClientRect();
      },
      contextElement: container,
    });

    _setPopup({ mode: 'tooltip', range, selection: selectionText, blockId });
  });

  const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (popup === null) return;
    if (event.key === 'Escape') closePopup();
  });

  const closeOnPointerDown = useEffectEvent((event: PointerEvent) => {
    const target = event.target;
    if (popup === null || !(target instanceof Node)) return;

    if (
      refs.floating.current?.contains(target) ||
      (popup.mode === 'tooltip' && containerRef.current?.contains(target))
    ) {
      return;
    }

    closePopup();
  });

  useEffect(() => {
    let frame: number | null = null;

    function scheduleSelectionPopover() {
      if (frame !== null) window.cancelAnimationFrame(frame);

      frame = window.requestAnimationFrame(() => {
        frame = null;
        updateSelectionPopover();
      });
    }

    document.addEventListener('selectionchange', scheduleSelectionPopover);
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnPointerDown);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('selectionchange', scheduleSelectionPopover);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="prose-no-margin"
      >
        {children}
      </div>

      {popup && (
        <FeedbackTextPopup
          popup={popup}
          refs={refs}
          floatingStyles={floatingStyles}
          expandPopup={expandPopup}
          closePopup={closePopup}
          onSendAction={onSendAction}
        />
      )}
    </>
  );
}

function FeedbackTextPopup({
  popup,
  refs,
  floatingStyles,
  expandPopup,
  closePopup,
  onSendAction,
}: {
  popup: {
    mode: 'tooltip' | 'expanded';
    blockId: string;
    selection: string;
    range: Range;
  };
  refs: ReturnType<typeof useFloating>['refs'];
  floatingStyles: CSSProperties;
  expandPopup: () => void;
  closePopup: () => void;
  onSendAction: (feedback: BlockFeedback) => Promise<ActionResponse>;
}) {
  const t = useTranslations();
  return (
    <div
      ref={(el) => refs.setFloating(el)}
      className={cn(
        'not-prose z-40 text-sm bg-fd-popover text-fd-popover-foreground border overflow-hidden shadow-lg rounded-xl w-30 h-9.5 box-content transition-[width,height]',
        popup.mode === 'expanded' ? 'w-[300px] h-32 max-w-[98vw]' : 'select-none',
      )}
      style={floatingStyles}
    >
      {popup.mode === 'tooltip' ? (
        <div className="w-30 h-9.5 p-1">
          <button
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'size-full gap-1.5',
            )}
            onClick={expandPopup}
          >
            <CornerDownRightIcon className="size-4 text-fd-muted-foreground" />
            {t('Feedback', { note: 'ui.feedback.tooltip' })}
          </button>
        </div>
      ) : (
        <FeedbackTextForm
          blockId={popup.blockId}
          selection={popup.selection}
          onSendAction={onSendAction}
          onClose={closePopup}
          container={{ className: 'p-2 w-[300px] h-32 max-w-[98vw] animate-fd-fade-in' }}
        />
      )}
    </div>
  );
}

function FeedbackTextForm({
  blockId,
  selection,
  onSendAction,
  onClose,
  container,
}: {
  container: HTMLAttributes<HTMLElement>;
  blockId: string;
  selection: string;
  onSendAction: (feedback: BlockFeedback) => Promise<ActionResponse>;
  onClose: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { previous, setPrevious } = useSubmissionStorage(`${pathname}-${blockId}`, (v) => {
    const result = blockFeedbackResult.safeParse(v);
    if (result.success) return result.data;
    return null;
  });
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(e?: SyntheticEvent) {
    startTransition(async () => {
      const feedback: BlockFeedback = {
        blockId,
        blockBody: selection,
        url: location.href,
        message,
      };

      const response = await onSendAction(feedback);
      setPrevious({
        response,
        ...feedback,
      });
      setMessage('');
    });

    e?.preventDefault();
  }

  if (previous)
    return (
      <div
        {...container}
        className={cn(
          'flex flex-col items-center justify-center gap-2 text-fd-muted-foreground text-center',
          container.className,
        )}
      >
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
              setPrevious(null);
            }}
          >
            {t('Submit Again', { note: 'ui.feedback.submit_again' })}
          </button>
        </div>
      </div>
    );

  return (
    <form
      {...container}
      className={cn('flex flex-col gap-2', container.className)}
      onSubmit={submit}
    >
      <textarea
        autoFocus
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border rounded-lg bg-fd-secondary text-fd-secondary-foreground p-3 resize-none focus-visible:outline-none placeholder:text-fd-muted-foreground"
        placeholder={t('Leave your feedback…', { note: 'ui.feedback.placeholder' })}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          if (!e.shiftKey && e.key === 'Enter') {
            submit(e);
          }
        }}
      />
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button
          type="submit"
          className={cn(buttonVariants({ variant: 'default', size: 'sm' }), 'gap-1.5')}
          disabled={isPending}
        >
          <CornerDownRightIcon className="size-4" />
          {t('Submit', { note: 'ui.feedback.submit' })}
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'gap-1.5')}
          disabled={isPending}
          onClick={onClose}
        >
          {t('Close', { note: 'ui.feedback.close' })}
        </button>
      </div>
    </form>
  );
}

