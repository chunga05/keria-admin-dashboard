'use client';

import { tokenStore } from './tokenStore';

export async function authFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  let token = tokenStore.get() ?? (await tokenStore.refreshOnce());

  const makeRequest = (t: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (t) headers.set('Authorization', `Bearer ${t}`);
    return fetch(url, { ...init, headers, credentials: 'include' });
  };

  const res = await makeRequest(token);

  if (res.status === 401) {
    const freshToken = await tokenStore.refreshOnce();
    if (!freshToken) return res;
    return makeRequest(freshToken);
  }

  return res;
}
