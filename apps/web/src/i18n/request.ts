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

  let messages;
  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch {
    messages = (await import('./messages/en.json')).default;
  }

  return {
    locale,
    messages,
    getMessageFallback: () => '',
  };
});
