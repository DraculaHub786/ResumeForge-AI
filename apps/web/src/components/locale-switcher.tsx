'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@resume-builder/ui';
import { isLocale, localeDetails, locales, type Locale } from '@/i18n/config';

export function LocaleSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const active = useLocale();
  const t = useTranslations('common');
  const [isPending, startTransition] = useTransition();

  const currentLocale: Locale = isLocale(active) ? active : 'en';
  const current = localeDetails[currentLocale] ?? localeDetails.en;

  function change(next: string) {
    if (!isLocale(next) || next === active) return;

    // One year, site-wide. `SameSite=Lax` keeps it out of cross-site requests.
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <Select value={currentLocale} onValueChange={change}>
      <SelectTrigger
        aria-label={t('language')}
        className={`h-9 min-w-[8.5rem] border border-slate-300 dark:border-slate-700 bg-background hover:border-slate-400 dark:hover:border-slate-600 rounded-lg shadow-2xs px-2.5 transition-all text-xs font-medium ${className ?? ''}`}
        disabled={isPending}
      >
        <div className="flex items-center gap-2 text-left truncate">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Globe className="h-3.5 w-3.5" />
          </span>
          <span className="text-sm shrink-0">{current.flag}</span>
          <span className="truncate text-foreground font-semibold text-xs">
            {current.native}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-80 w-56 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl p-1 bg-popover">
        <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
          Select Language ({locales.length})
        </div>
        {locales.map((locale) => {
          const item = localeDetails[locale];
          const isSelected = locale === currentLocale;
          return (
            <SelectItem
              key={locale}
              value={locale}
              className={`rounded-lg my-0.5 text-xs py-1.5 cursor-pointer ${isSelected ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold' : 'hover:bg-muted'}`}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm shrink-0">{item.flag}</span>
                  <span className="font-medium truncate">{item.native}</span>
                  {item.native !== item.label && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      ({item.label})
                    </span>
                  )}
                </div>
                {isSelected && <Check className="h-3 w-3 text-orange-500 shrink-0 ml-1" />}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
