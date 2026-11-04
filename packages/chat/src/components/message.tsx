'use client';
import type {ReactNode} from 'react';
import {Bubble, BubbleContent} from '@terrafirmagreg-team/ui/components/ui/bubble';
import {Message, MessageAvatar, MessageContent, MessageHeader} from '@terrafirmagreg-team/ui/components/ui/message';
import type {ChatMessage, ChatTranslate} from '@terrafirmagreg-team/chat/types';

export function ChatMessageRow({
  message,
  own = false,
  avatar,
  t,
}: {
  message: ChatMessage;
  own?: boolean;
  avatar?: ReactNode;
  t: ChatTranslate;
}) {
  const channel = message.type === 'chat' ? message.channel : undefined;

  const content = (() => {
    switch (message.type) {
      case 'chat':
        return message.message;
      case 'playerjoin':
        return message.playerName
          ? t('{playername} joined the game', {note: 'chat.playerJoin', variables: {playername: message.playerName}})
          : t('A player joined the game', {note: 'chat.anonymousJoin'});
      case 'playerleave':
        return message.playerName
          ? t('{playername} left the game', {note: 'chat.playerQuit', variables: {playername: message.playerName}})
          : t('A player left the game', {note: 'chat.anonymousQuit'});
    }
  })();

  if (!content) return null;

  if (message.type !== 'chat') {
    return <p className="chat__event">{content}</p>;
  }

  return (
    <Message align={own ? 'end' : 'start'}>
      {!own && avatar && <MessageAvatar>{avatar}</MessageAvatar>}
      <MessageContent>
        {!own && (
          <MessageHeader className="chat__meta">
            {}
            <span>{message.playerName || channel || '…'}</span>
            {!!message.playerName && channel && <span>{channel}</span>}
          </MessageHeader>
        )}
        <Bubble variant={own ? 'default' : 'muted'} align={own ? 'end' : 'start'}>
          <BubbleContent>{content}</BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

