/**
 * Auth layout — a centered card shell shared by sign-in and sign-up.
 * Enhanced with monochrome architectural grid and ambient orange glow.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background bg-grid-blueprint px-4 py-12 text-foreground overflow-hidden">
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

      <div className="relative mb-6 flex w-full max-w-md items-center justify-between gap-3 px-1">
        <Link href="/" className="group flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
            R
          </span>
          <span>
            Resume<span className="text-orange-500">Forge</span>
          </span>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-orange-400">
            AI
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
        </div>
      </div>

      <div className="relative w-full max-w-md">{children}</div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Secure, account-scoped resume storage · AES-256 encrypted
      </p>
    </main>
  );
}
