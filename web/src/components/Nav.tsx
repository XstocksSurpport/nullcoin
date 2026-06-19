import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'
import { XIcon } from './XIcon'
import { TelegramIcon } from './TelegramIcon'
import { LanguageSwitcher } from './LanguageSwitcher'
import { usePrivyAuth } from '../hooks/usePrivyAuth'
import { useAutoSwitchChain } from '../hooks/useAutoSwitchChain'
import { TELEGRAM_URL, X_URL } from '../config/site'

type NavProps = {
  active: string
  onNavigate: (id: string) => void
}

const LINK_IDS = ['overview', 'mint', 'strike', 'shield', 'docs'] as const

const NAV_LABEL_KEYS: Record<(typeof LINK_IDS)[number], string> = {
  overview: 'nav.home',
  mint: 'nav.mint',
  strike: 'nav.transfer',
  shield: 'nav.shield',
  docs: 'nav.docs',
}

type NavLinksProps = {
  active: string
  className: string
  onNavigate: (id: string) => void
}

function NavLinks({ active, className, onNavigate }: NavLinksProps) {
  const { t } = useTranslation()

  return (
    <nav className={className} aria-label={t('nav.menu')}>
      {LINK_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`nav-link ${active === id ? 'active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          {t(NAV_LABEL_KEYS[id])}
        </button>
      ))}
    </nav>
  )
}

export function Nav({ active, onNavigate }: NavProps) {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const { ready, linked, address, pending, connect, disconnect } = usePrivyAuth()
  const { isSwitching } = useAutoSwitchChain()

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''

  function go(id: string) {
    onNavigate(id)
  }

  function handleAuth() {
    if (linked) {
      void disconnect()
      return
    }
    connect()
  }

  const authLabel = !ready || pending ? '…' : linked ? t('nav.disconnect') : t('nav.connectWallet')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <NavLinks active={active} className="nav-links nav-links-desktop" onNavigate={go} />

          <button type="button" className="nav-brand" onClick={() => go('overview')}>
            <Logo markSize={39} />
          </button>

          <div className="nav-actions">
            {linked && address && !isSwitching && (
              <span className="nav-wallet">{short}</span>
            )}
            {linked && isSwitching && <span className="nav-wallet">…</span>}
            <LanguageSwitcher />
            <button
              type="button"
              className="btn-pill"
              disabled={!ready || pending}
              onClick={handleAuth}
            >
              {authLabel}
            </button>
            <a
              href={X_URL}
              className="nav-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('nav.xTwitter')}
            >
              <XIcon className="nav-social-icon" />
            </a>
            <a
              href={TELEGRAM_URL}
              className="nav-social-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('nav.telegram')}
            >
              <TelegramIcon className="nav-social-icon" />
            </a>
          </div>
        </div>
      </header>

      <NavLinks active={active} className="nav-tabbar" onNavigate={go} />
    </>
  )
}
