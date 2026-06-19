import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_LOCALE,
  LOCALE_EXPLICIT_KEY,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getLanguageOption,
  isLocale,
  type Locale,
} from './languages'
import ar from './locales/ar'
import de from './locales/de'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import ja from './locales/ja'
import ko from './locales/ko'
import ru from './locales/ru'
import zhTW from './locales/zh-TW'

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const explicit = localStorage.getItem(LOCALE_EXPLICIT_KEY) === '1'
  if (!explicit) return DEFAULT_LOCALE
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored && isLocale(stored) ? stored : DEFAULT_LOCALE
}

function applyDocumentLocale(locale: Locale) {
  const { dir } = getLanguageOption(locale)
  document.documentElement.lang = locale
  document.documentElement.dir = dir
}

const initialLocale = readStoredLocale()
applyDocumentLocale(initialLocale)

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
    ar: { translation: ar },
    'zh-TW': { translation: zhTW },
    es: { translation: es },
    fr: { translation: fr },
    ru: { translation: ru },
    de: { translation: de },
  },
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...SUPPORTED_LOCALES],
  nonExplicitSupportedLngs: false,
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  if (!isLocale(lng)) return
  applyDocumentLocale(lng)
})

export { i18n }
export type { Locale }
export {
  DEFAULT_LOCALE,
  LANGUAGES,
  LOCALE_EXPLICIT_KEY,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  getLanguageOption,
  isLocale,
  saveLocalePreference,
} from './languages'
