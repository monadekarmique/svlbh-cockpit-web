import { macAuthHeaders } from './mac-auth';

const PF_BASE_URL = 'https://checkout.postfinance.ch';

export async function pfApiCall<T = unknown>(opts: {
  userId: number;
  authKeyBase64: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  path: string;
  body?: object;
}): Promise<T> {
  const headers = {
    ...macAuthHeaders({
      userId: opts.userId,
      authKeyBase64: opts.authKeyBase64,
      method: opts.method,
      path: opts.path,
    }),
    'Content-Type': 'application/json;charset=utf-8',
    'Accept': 'application/json',
  };

  const res = await fetch(`${PF_BASE_URL}${opts.path}`, {
    method: opts.method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PF API ${res.status}: ${text}`);
  }

  return res.json();
}
