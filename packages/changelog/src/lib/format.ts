export const bcp47 = (lang: string) => lang.replace('_', '-');

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const monthFormat = (lang: string) =>
  new Intl.DateTimeFormat(bcp47(lang), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const monthLabel = (lang: string, date: Date) =>
  capitalize(monthFormat(lang).format(date));

export const dayFormat = (lang: string) =>
  new Intl.DateTimeFormat(bcp47(lang), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
