import { useTranslation } from 'react-i18next'
import {
  LLNU_TOKENS_PER_SHARE,
  MINT_PRICE_ETH,
  MINT_TARGET_ETH,
  NETWORK_LABEL,
  TOKENS_PER_SHARE,
} from '../config/contracts'
import { useMintCapUsd } from '../hooks/useEthUsdPrice'

export function HeroTicker() {
  const { t } = useTranslation()
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)

  const ITEMS = [
    t('hero.ticker.brand'),
    t('hero.ticker.ethPerShare', { price: MINT_PRICE_ETH }),
    t('hero.ticker.tokenSplit', {
      null: TOKENS_PER_SHARE.toLocaleString(),
      llnu: LLNU_TOKENS_PER_SHARE.toLocaleString(),
    }),
    t('hero.ticker.target', { amount: mintCapUsd }),
    NETWORK_LABEL,
    t('hero.ticker.v4Hook'),
  ]

  const track = [...ITEMS, ...ITEMS, ...ITEMS]

  return (
    <div className="hero-ticker" aria-hidden>
      <div className="hero-ticker-track">
        {track.map((item, i) => (
          <span key={`${item}-${i}`} className="hero-ticker-item">
            {item}
            <span className="hero-ticker-hash">#</span>
          </span>
        ))}
      </div>
    </div>
  )
}
