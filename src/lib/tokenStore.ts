'use client';

let _token: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export const tokenStore = {
  get(): string | null {
    return _token;
  },

  set(token: string): void {
    _token = token;
  },

  clear(): void {
    _token = null;
  },

  refreshOnce(): Promise<string | null> {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) { _token = null; return null; }
        const { access_token } = await res.json();
        _token = access_token as string;
        return _token;
      })
      .catch(() => { _token = null; return null; })
      .finally(() => { _refreshPromise = null; });

    return _refreshPromise;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* best-effort */ }
    _token = null;
  },
};
