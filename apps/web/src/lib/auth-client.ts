/**
 * Better Auth client for the browser.
 *
 * The API server owns the session; the web app talks to it through this
 * client so there is a single place that knows the auth endpoints, cookie
 * behaviour, and the API origin.
 */
import { createAuthClient } from 'better-auth/react';
import { API_URL } from './env';

export { API_URL };

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/api/auth',
  fetchOptions: {
    // The session cookie lives on the API origin, so credentials must be sent.
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
