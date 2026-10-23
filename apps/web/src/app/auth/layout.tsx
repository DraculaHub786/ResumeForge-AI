/**
 * Auth layout — a centred card shell shared by sign-in and sign-up.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-6 flex w-full max-w-sm items-center justify-between gap-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Resume<span className="text-primary">Forge</span>
        </Link>
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
