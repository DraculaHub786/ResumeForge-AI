'use client';

/**
 * Session hook.
 *
 * Wraps Better Auth's `useSession` so components get a stable shape:
 * `{ user, isLoading, isAuthenticated, signOut }`. A failed session fetch is
 * treated as "signed out" rather than an error — the app still works for
 * guests building locally.
 */
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export function useSession() {
  const router = useRouter();
  const { data, isPending, refetch } = authClient.useSession();

  const user: SessionUser | null =
    data?.user
      ? {
          id: data.user.id,
          name: data.user.name ?? '',
          email: data.user.email ?? '',
          image: data.user.image ?? null,
        }
      : null;

  const signOut = useCallback(async () => {
    await authClient.signOut();
    // The cached session is not invalidated by signing out, so the app would
    // keep treating the visitor as signed in. Re-read it from the server.
    await refetch();
    router.push('/auth/login');
    router.refresh();
  }, [router, refetch]);

  return {
    user,
    isLoading: isPending,
    isAuthenticated: Boolean(user),
    signOut,
    /**
     * Re-read the session from the server.
     *
     * Call this after signing in or up: the session cache still holds the
     * previous (signed-out) state, and without a refresh the app would bounce
     * the user straight back to the sign-in page.
     */
    refresh: refetch,
  };
}
