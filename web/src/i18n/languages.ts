export const SUPPORTED_LOCALES = [
  'en',
  'ko',
  'ja',
  'ar',
  'zh-TW',
  'es',
  'fr',
  'ru',
  'de',
] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_STORAGE_KEY = 'null-locale'
export const LOCALE_EXPLICIT_KEY = 'null-locale-explicit'

export type LanguageOption = {
  code: Locale
  label: string
  nativeLabel: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', dir: 'ltr' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { code: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文', dir: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', dir: 'ltr' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
]

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function saveLocalePreference(locale: Locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  localStorage.setItem(LOCALE_EXPLICIT_KEY, '1')
}

export function getLanguageOption(code: Locale): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
