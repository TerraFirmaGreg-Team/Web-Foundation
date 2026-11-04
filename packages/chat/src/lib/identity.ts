import type {ChatMessage} from '@terrafirmagreg-team/chat/types';

export function getStoredName(key: string): string {
  try {
    return window.localStorage?.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function setStoredName(key: string, name: string): void {
  try {
    window.localStorage?.setItem(key, name);
  } catch {

  }
}

export function isOwnChatMessage(
  message: ChatMessage,
  names: {chatName?: string; loginName?: string},
): boolean {
  if (message.type !== 'chat' || message.source !== 'web') return false;
  const chat = names.chatName?.trim();
  const login = names.loginName?.trim();
  return (!!chat && message.playerName === chat) || (!!login && message.playerName === login);
}

