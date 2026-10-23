/**
 * Language switcher.
 *
 * The chosen language is stored in a cookie (not the URL) so every existing
 * route keeps working and links stay shareable. Changing it writes the cookie
 * and refreshes the server components, which re-render in the new locale.
 */

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Languages } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@resume-builder/ui';
import { isLocale, localeNames, locales } from '@/i18n/config';

export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const active = useLocale();
  const t = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  function change(next: string) {
    if (!isLocale(next) || next === active) return;

    // One year, site-wide. `SameSite=Lax` keeps it out of cross-site requests.
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Select value={isLocale(active) ? active : 'en'} onValueChange={change}>
      <SelectTrigger
        aria-label={t('language')}
        className={`h-9 w-[9.5rem] ${className ?? ''}`}
        disabled={isPending}
      >
        <span className="flex items-center gap-2">
          <Languages className="h-4 w-4 shrink-0 opacity-70" />
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {localeNames[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
