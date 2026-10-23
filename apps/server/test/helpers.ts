/**
 * Test helpers — boot the real Express app on an ephemeral port and talk to it
 * over `fetch`, so the tests exercise the same middleware stack, auth guard
 * and error handling that production traffic hits.
 */

import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Headers;
  /** The first cookie pair the server set, ready to be sent back. */
  cookie?: string;
}

let server: Server | null = null;
let origin = '';

export async function startServer(): Promise<string> {
  if (server) return origin;

  const app = createApp();
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  origin = `http://127.0.0.1:${port}`;
  return origin;
}

export async function stopServer(): Promise<void> {
  if (!server) return;
  const s = server;
  server = null;
  await new Promise<void>((resolve) => s.close(() => resolve()));
}

interface RequestOptions {
  cookie?: string;
  headers?: Record<string, string>;
}

/** Perform a JSON request against the test server. */
export async function api<T = unknown>(
  method: string,
  path: string,
  options: RequestOptions & { body?: unknown } = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.cookie) headers.Cookie = options.cookie;

  const res = await fetch(`${origin}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    /* keep the raw text for non-JSON responses */
  }

  const setCookie = res.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : undefined;

  return { status: res.status, body: body as T, headers: res.headers, cookie };
}

/**
 * Create a signed-in user and return the session cookie.
 *
 * The account is created through the real Better Auth sign-up endpoint, so
 * the cookie it returns is the same one a browser would receive.
 */
export async function signUp(email = 'test@example.com'): Promise<string> {
  const res = await api<{ token?: string }>('POST', '/api/auth/sign-up/email', {
    body: { email, password: 'SuperSecret123!', name: 'Test User' },
  });
  if (res.status >= 400 || !res.cookie) {
    throw new Error(`Sign-up failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.cookie;
}
