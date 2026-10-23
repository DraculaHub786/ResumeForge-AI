'use client';

/**
 * User menu — shows the signed-in user and a sign-out action.
 *
 * Rendered in the dashboard and builder headers. When nobody is signed in it
 * shows a link to the sign-in page, since guests can still build and export a
 * resume locally.
 */
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@resume-builder/ui';
import { useSession } from '@/hooks/use-session';

export function UserMenu() {
  const { user, isLoading, signOut } = useSession();
  const t = useTranslations('common');

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />;
  }

  if (!user) {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href="/auth/login">
          <UserIcon className="mr-2 h-4 w-4" />
          {t('signIn')}
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.name || user.email}
      </span>
      <Button size="sm" variant="ghost" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        {t('signOut')}
      </Button>
    </div>
  );
}
