'use client';
import {useRef, useState, type FormEvent, type ReactNode} from 'react';
import {ArrowUp, LogIn, User, WifiOff, X} from 'lucide-react';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@terrafirmagreg-team/ui/components/ui/empty';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@terrafirmagreg-team/ui/components/ui/input-group';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@terrafirmagreg-team/ui/components/ui/message-scroller';
import {
  getStoredName,
  isOwnChatMessage,
  setStoredName,
} from '@terrafirmagreg-team/chat/lib';
import type { ChatMessage, ChatTranslate } from '@terrafirmagreg-team/chat/types';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import {ChatMessageRow} from './message';

export function ChatBox({
  messages,
  t,
  offline = false,
  loggedIn = false,
  loginRequired = false,
  maxLength,
  messageHistory,
  showPlayerFaces = false,
  anonymousNameKey = 'plugin.chatname',
  loginNameKey = 'plugin.loginname',
  send,
  onClose,
  onLogin,
  renderAvatar,
  unknownError = 'Unknown error',
}: {
  messages: readonly ChatMessage[];
  t: ChatTranslate;

  offline?: boolean;
  loggedIn?: boolean;
  loginRequired?: boolean;
  maxLength?: number;

  messageHistory?: number;
  showPlayerFaces?: boolean;

  anonymousNameKey?: string;
  loginNameKey?: string;

  send?: (message: string, name?: string) => Promise<void>;
  onClose?: () => void;
  onLogin?: () => void;

  renderAvatar?: (playerAccount: string) => ReactNode;

  unknownError?: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [enteredMessage, setEnteredMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendingError, setSendingError] = useState<string | null>(null);

  const [chatName, setChatName] = useState(() => getStoredName(anonymousNameKey));
  const rememberChatName = (name: string) => {
    setChatName(name);
    setStoredName(anonymousNameKey, name);
  };
  const loginName = getStoredName(loginNameKey);

  const shown = messageHistory
    ? messages.slice(0, messageHistory).reverse()
    : [...messages].reverse();

  const sendingEnabled = !loginRequired || loggedIn;
  const nameMissing = !loggedIn && !chatName.trim();

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const message = enteredMessage.trim().substring(0, maxLength);
    if (!message || nameMissing) return;

    if (!send) return;

    setSendingMessage(true);
    setSendingError(null);
    try {
      await send(message, loggedIn ? undefined : chatName.trim() || undefined);
      setEnteredMessage('');
    } catch (err) {
      setSendingError(
        err instanceof Error
          ? err.message
          : t(unknownError, { note: 'chat.errorUnknown' }),
      );
    } finally {
      setSendingMessage(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <section className="chat">
      <header className="chat__header">
        <p className="chat__title">{t('Chat', { note: 'chat.title' })}</p>
        {onClose && (
          <Hint label={t('Close', { note: 'common.close' })}>
            <button
              type="button"
              className="chat__close"
              aria-label={t('Close', { note: 'common.close' })}
              onClick={onClose}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </Hint>
        )}
      </header>
      {offline ? (
        <div className="chat__offline" role="status">
          <span className="chat__offline-chip">
            <WifiOff className="size-3.5" aria-hidden="true" />
            {t('Servers offline', { note: 'servers.offline' })}
          </span>
        </div>
      ) : (
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="chat__scroll">
            <MessageScrollerViewport role="log" aria-live="polite" aria-relevant="additions">
              <MessageScrollerContent className="chat__content">
                {shown.map(message => (
                  <MessageScrollerItem key={message.timestamp + (message.playerName ?? '')}>
                    <ChatMessageRow
                      message={message}
                      own={isOwnChatMessage(message, {chatName, loginName})}
                      avatar={
                        showPlayerFaces && message.playerAccount
                          ? renderAvatar?.(message.playerAccount)
                          : undefined
                      }
                      t={t}
                    />
                  </MessageScrollerItem>
                ))}
                {!shown.length && (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>
                        {t('Chat', { note: 'chat.title' })}
                      </EmptyTitle>
                      <EmptyDescription>
                        {t('No messages yet', { note: 'chat.noMessages' })}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      )}
      {!offline && send && sendingEnabled && (
        <form className="chat__form" onSubmit={sendMessage}>
          {sendingError && (
            <div className="chat__error" role="alert">
              <span className="chat__error-dot" aria-hidden="true" />
              <span className="flex-1 min-w-0">{sendingError}</span>
            </div>
          )}
          <InputGroup>
            {!loggedIn && (
              <InputGroupAddon align="block-start" className="border-b">
                <User aria-hidden="true" />
                <input
                  className="chat__name"
                  type="text"
                  value={chatName}
                  maxLength={24}
                  placeholder={t('Name', { note: 'chat.namePlaceholder' })}
                  aria-label={t('Name', { note: 'chat.nameLabel' })}
                  onChange={e => rememberChatName(e.target.value)}
                />
              </InputGroupAddon>
            )}
            <InputGroupTextarea
              ref={inputRef}
              rows={2}
              value={enteredMessage}
              maxLength={maxLength}
              placeholder={nameMissing ? t('Name', { note: 'chat.namePlaceholder' }) : t('Message', { note: 'chat.placeholder' })}
              disabled={sendingMessage || nameMissing}
              aria-label={t('Message', { note: 'chat.placeholder' })}
              onChange={e => setEnteredMessage(e.target.value)}
              onKeyDown={e => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <InputGroupAddon align="block-end" className="justify-end">
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                disabled={!enteredMessage.trim() || sendingMessage || nameMissing}
                aria-label={t('Send', { note: 'chat.send' })}>
                <ArrowUp strokeWidth={2.25} aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      )}
      {send && loginRequired && !loggedIn && onLogin && (
        <button type="button" className="chat__login" onClick={onLogin}>
          <LogIn className="size-4" aria-hidden="true" />
          {t('Log in', { note: 'chat.login' })}
        </button>
      )}
    </section>
  );
}

