export type ChatMessageType = 'chat' | 'playerjoin' | 'playerleave';

export interface ChatMessage {
  type: ChatMessageType;

  message?: string;

  playerName?: string;

  playerAccount?: string;

  channel?: string;

  source?: string;
  timestamp?: number;
}

export interface ChatBoxSettings {

  messageHistory?: number;

  showPlayerFaces?: boolean;
}

export interface ChatSendingSettings {
  maxLength?: number;

  loginRequired?: boolean;
}

export type ChatTranslate = (
  text: string,
  opts?: { note?: string; variables?: Record<string, string> },
) => string;

