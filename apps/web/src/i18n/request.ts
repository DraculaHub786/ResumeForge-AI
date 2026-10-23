/**
 * The request configuration for `next-intl`.
 *
 * next-intl resolves this file automatically (it looks for `src/i18n/request.ts`).
 * The active locale is read from the `locale` cookie that the language
 * switcher writes, so a choice survives a reload and a shared link.
 */

import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, isLocale } from './config';

export default getRequestConfig(async () => {
  const requested = (await cookies()).get('locale')?.value;
  const locale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    // A missing translation falls back to the key rather than throwing, so a
    // partially translated catalogue never breaks a page.
    getMessageFallback: () => '',
  };
});
