/**
 * Sign-up form.
 *
 * Isolated in a client component because it talks to Better Auth.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const { refresh } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      const message =
        field === 'name'
          ? t('errors.name')
          : field === 'password'
            ? t('errors.password')
            : field === 'email'
              ? t('errors.email')
              : t('errors.invalid');
      setError(message);
      return;
    }

    setPending(true);
    const { error: authError } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setPending(false);

    if (authError) {
      setError(authError.message ?? t('register.error'));
      toast.error(authError.message ?? t('register.error'));
      return;
    }

    toast.success(t('register.success'));
    // Pick up the new session before navigating — the cached one still says
    // "signed out", which would bounce the visitor straight back here.
    await refresh();
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <Card className="rounded-2xl border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold tracking-tight">{t('register.title')}</CardTitle>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400">
            Sign Up
          </span>
        </div>
        <CardDescription>{t('register.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('register.name')}
            </Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder={t('register.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/60 focus-visible:ring-orange-500/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('register.email')}
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t('register.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/60 focus-visible:ring-orange-500/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('register.password')}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder={t('register.passwordPlaceholder')}
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
            {pending ? t('register.submitting') : t('register.submit')}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link href="/auth/login" className="font-semibold text-orange-400 hover:text-orange-300 transition-colors">
            {t('register.signInLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
