'use client';

export function redirectToCommentsLogin(apiUrl: string): void {
  const login = new URL(`${apiUrl}/oauth/login`, window.location.origin);
  login.searchParams.set('return', window.location.href);
  window.location.href = login.href;
}

export function redirectToCommentsLogout(apiUrl: string): void {
  const logout = new URL(`${apiUrl}/oauth/logout`, window.location.origin);
  logout.searchParams.set('return', window.location.href);
  window.location.href = logout.href;
}

