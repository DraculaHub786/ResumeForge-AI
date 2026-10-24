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
    <Card className="rounded-2xl border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight">{t('login.title')}</CardTitle>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
            Sign In
          </span>
        </div>
        <CardDescription>{t('login.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('login.email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/60 focus-visible:ring-orange-500/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('login.password')}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/60 focus-visible:ring-orange-500/40"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-orange-500/10"
            disabled={pending}
          >
            {pending ? t('login.submitting') : t('login.submit')}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link href="/auth/register" className="font-semibold text-orange-400 hover:text-orange-300 transition-colors">
            {t('login.createOne')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
