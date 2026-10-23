/**
 * Internationalisation configuration.
 *
 * The app does not put the locale in the URL: the choice is stored in a
 * cookie and applied server-side, so the existing routes (`/dashboard`,
 * `/builder/[id]`, …) keep working and links stay shareable.
 */

/** Every locale the app ships with. */
export const locales = ['en', 'es', 'fr', 'de'] as const;

export type Locale = (typeof locales)[number];

/** The locale used when the visitor has not chosen one. */
export const defaultLocale: Locale = 'en';

/** Human-readable names, written in the language itself. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
