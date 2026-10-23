/**
 * Sign-in form.
 *
 * Isolated in a client component because it reads the `next` query parameter
 * and talks to Better Auth.
 */

'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@resume-builder/ui';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/hooks/use-session';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export function LoginForm() {
  // `useSearchParams` opts the tree into client-side rendering, so the form
  // is isolated behind a Suspense boundary to keep the page statically
  // renderable.
  return (
    <Suspense fallback={<div className="h-64" aria-hidden />}>
      <LoginCard />
    </Suspense>
  );
}

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth');
  const { refresh } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Where to land after signing in — set by the builder page when it bounces
  // a signed-out visitor here. Only same-origin paths are honoured.
  const nextPath = (() => {
    const raw = searchParams.get('next');
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard';
    return raw;
  })();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message =
        issue?.path[0] === 'password'
          ? t('errors.password')
          : issue?.path[0] === 'email'
            ? t('errors.email')
            : t('errors.invalid');
      setError(message);
      return;
    }

    setPending(true);
    const { error: authError } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setPending(false);

    if (authError) {
      setError(authError.message ?? t('login.error'));
      toast.error(authError.message ?? t('login.error'));
      return;
    }

    toast.success(t('login.success'));
    // Pick up the new session before navigating — the cached one still says
    // "signed out", which would bounce the visitor straight back here.
    await refresh();
    router.push(nextPath);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('login.title')}</CardTitle>
        <CardDescription>{t('login.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('login.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            {t('login.createOne')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
