import { useTranslation } from 'react-i18next'
import { MINT_PRICE_ETH, MINT_TARGET_ETH, TARGET_CHAIN_ID, getContracts, isProtocolLive } from '../config/contracts'
import { useTargetChain } from '../hooks/useTargetChain'
import { useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { nullMintAbi } from '../abi/nullMint'
import { HeroTicker } from './HeroTicker'

type HeroProps = {
  onMint: () => void
}

export function Hero({ onMint }: HeroProps) {
  const { t } = useTranslation()
  const { protocolLive } = useTargetChain()
  const configured = getContracts(TARGET_CHAIN_ID)
  const live = protocolLive && isProtocolLive(configured)

  const { data } = useReadContracts({
    contracts: live && configured
      ? [
          { address: configured.nullMint, abi: nullMintAbi, functionName: 'mintProgressBps' },
          { address: configured.nullMint, abi: nullMintAbi, functionName: 'totalEthRaised' },
        ]
      : [],
    query: { enabled: live },
  })

  const progressPct =
    data?.[0]?.result !== undefined ? (Number(data[0].result) / 100).toFixed(1) : '0.0'
  const ethRaised = data?.[1]?.result !== undefined ? formatEther(data[1].result) : '0'

  return (
    <section className="hero snap-page">
      <div className="hero-headline-row">
        <h1 className="hero-display">
          {t('hero.headline1')}
          <br />
          {t('hero.headline2')}
        </h1>
        <div className="hero-aside">
          <p className="hero-aside-lead">{t('hero.lead')}</p>
          <p>{t('hero.nullCreates')}</p>
          <p>{t('hero.body')}</p>
          {live && Number(ethRaised) > 0 && (
            <p>{t('hero.ethRaised', { amount: ethRaised })}</p>
          )}
        </div>
      </div>

      <div className="hero-card">
        <div className="hero-card-notch" aria-hidden />

        <div className="hero-card-body">
          <div className="hero-card-metrics">
            <div>
              <span className="hero-card-metric">{progressPct}%</span>
              <span className="hero-card-metric-label">{t('hero.raise')}</span>
            </div>
            <div>
              <span className="hero-card-metric">{MINT_TARGET_ETH} ETH</span>
              <span className="hero-card-metric-label">{t('hero.cap')}</span>
            </div>
            <div>
              <span className="hero-card-metric">{MINT_PRICE_ETH} ETH</span>
              <span className="hero-card-metric-label">{t('hero.perShare')}</span>
            </div>
          </div>

          <button type="button" className="hero-card-cta" onClick={onMint}>
            {t('hero.startMinting')}
          </button>
        </div>

        <HeroTicker />
      </div>
    </section>
  )
}
