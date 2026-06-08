import { createHmac } from 'crypto';

export function macAuthHeaders(opts: {
  userId: number;
  authKeyBase64: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
}) {
  const version = '1';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${version}|${opts.userId}|${timestamp}|${opts.method}|${opts.path}`;
  const keyBytes = Buffer.from(opts.authKeyBase64, 'base64');
  const macBytes = createHmac('sha512', keyBytes).update(message).digest();
  const macValue = macBytes.toString('base64');
  return {
    'x-mac-userid': opts.userId.toString(),
    'x-mac-version': version,
    'x-mac-timestamp': timestamp,
    'x-mac-value': macValue,
  };
}
