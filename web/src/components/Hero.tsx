import { useTranslation } from 'react-i18next'
import {
  MINT_PRICE_ETH,
  MINT_TARGET_ETH,
  PAYMENT_SYMBOL,
} from '../config/contracts'
import { useDisplayMintProgress } from '../hooks/useDisplayMintProgress'
import { HeroCube } from './HeroCube'
import { HeroTicker } from './HeroTicker'

type HeroProps = {
  onMint: () => void
  onShield: () => void
}

export function Hero({ onMint, onShield }: HeroProps) {
  const { t } = useTranslation()
  const progressPct = useDisplayMintProgress().toFixed(2)

  return (
    <section className="hero-cinematic snap-page">
      <div className="hero-cinematic-bg" aria-hidden>
        <div className="hero-cinematic-bg-image" />
        <div className="hero-cinematic-bg-light" />
        <div className="hero-cinematic-bg-grain" />
      </div>

      <div className="hero-cinematic-inner">
        <HeroCube />

        <h1 className="hero-cinematic-title">
          <span>{t('hero.headline1')}</span>
          <span>{t('hero.headline2')}</span>
        </h1>

        <p className="hero-cinematic-lead">{t('hero.lead')}</p>
        <p className="hero-cinematic-body">{t('hero.body')}</p>

        <div className="hero-cinematic-actions">
          <button type="button" className="btn-ghost-pill" onClick={onMint}>
            {t('home.joinPresale')}
          </button>
          <button type="button" className="btn-ghost-pill" onClick={onShield}>
            {t('home.protection')}
          </button>
        </div>

        <div className="hero-glass-strip">
          <div className="hero-glass-metric">
            <span className="hero-glass-metric-value">{progressPct}%</span>
            <span className="hero-glass-metric-label">{t('hero.raise')}</span>
          </div>
          <div className="hero-glass-metric">
            <span className="hero-glass-metric-value">
              {MINT_TARGET_ETH} {PAYMENT_SYMBOL}
            </span>
            <span className="hero-glass-metric-label">{t('hero.cap')}</span>
          </div>
          <div className="hero-glass-metric">
            <span className="hero-glass-metric-value">
              {MINT_PRICE_ETH} {PAYMENT_SYMBOL}
            </span>
            <span className="hero-glass-metric-label">{t('hero.perShare')}</span>
          </div>
        </div>
      </div>

      <HeroTicker />
    </section>
  )
}
