export function guideMessage(
  messages: Record<string, string>,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let text = messages[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

