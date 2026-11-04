export type Lang = string;

export type LocaleMessages = Record<string, string>;

export type LocaleRegistry = {
  languages: string[];
  defaultLanguage: string;
  messages: Record<string, LocaleMessages>;
};

