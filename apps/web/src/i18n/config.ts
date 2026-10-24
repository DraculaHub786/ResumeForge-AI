/**
 * Internationalisation configuration.
 *
 * The app does not put the locale in the URL: the choice is stored in a
 * cookie and applied server-side, so the existing routes (`/dashboard`,
 * `/builder/[id]`, …) keep working and links stay shareable.
 */

/** Every locale the app ships with. */
export const locales = [
  'en',
  'es',
  'fr',
  'de',
  'hi',
  'zh',
  'ja',
  'ar',
  'pt',
  'it',
  'ru',
  'ko',
  'nl',
  'tr',
  'pl',
  'id',
  'vi',
  'sv',
  'uk',
  'el',
] as const;

export type Locale = (typeof locales)[number];

/** The locale used when the visitor has not chosen one. */
export const defaultLocale: Locale = 'en';

export interface LocaleMeta {
  code: Locale;
  label: string;
  native: string;
  flag: string;
}

/** Human-readable names, native spelling, and country flags. */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  hi: 'हिन्दी (Hindi)',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  ar: 'العربية (Arabic)',
  pt: 'Português',
  it: 'Italiano',
  ru: 'Русский (Russian)',
  ko: '한국어 (Korean)',
  nl: 'Nederlands',
  tr: 'Türkçe',
  pl: 'Polski',
  id: 'Bahasa Indonesia',
  vi: 'Tiếng Việt',
  sv: 'Svenska',
  uk: 'Українська',
  el: 'Ελληνικά',
};

export const localeDetails: Record<Locale, LocaleMeta> = {
  en: { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  es: { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
  fr: { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  de: { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  hi: { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  zh: { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳' },
  ja: { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  ar: { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  pt: { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  it: { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  ru: { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  ko: { code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷' },
  nl: { code: 'nl', label: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  tr: { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  pl: { code: 'pl', label: 'Polish', native: 'Polski', flag: '🇵🇱' },
  id: { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  vi: { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  sv: { code: 'sv', label: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  uk: { code: 'uk', label: 'Ukrainian', native: 'Українська', flag: '🇺🇦' },
  el: { code: 'el', label: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
