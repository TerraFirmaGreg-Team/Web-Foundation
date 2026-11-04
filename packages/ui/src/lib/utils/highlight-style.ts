const injected = new Set<string>();

export function injectHighlightStyle(name: string, css: string): void {
  if (injected.has(name) || typeof document === 'undefined') return;
  injected.add(name);
  const style = document.createElement('style');
  style.textContent = `::highlight(${name}){${css}}`;
  document.head.appendChild(style);
}

