import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, saveLocalePreference, type Locale } from '../i18n'

function GlobeIcon() {
  return (
    <svg className="nav-lang-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0]

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  function selectLocale(code: Locale) {
    saveLocalePreference(code)
    void i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="nav-lang" ref={rootRef}>
      <button
        type="button"
        className="nav-lang-btn"
        aria-label={t('lang.select')}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon />
      </button>

      {open && (
        <ul className="nav-lang-menu" role="listbox" aria-label={t('lang.select')}>
          {LANGUAGES.map((lang) => (
            <li key={lang.code} role="option" aria-selected={lang.code === current.code}>
              <button
                type="button"
                className={`nav-lang-option${lang.code === current.code ? ' active' : ''}`}
                onClick={() => selectLocale(lang.code)}
              >
                <span className="nav-lang-native">{lang.nativeLabel}</span>
                <span className="nav-lang-label">{lang.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
