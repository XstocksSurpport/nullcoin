import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CARD_MONTH_NULL,
  CARD_QUARTER_NULL,
  CARD_YEAR_NULL,
  LLNU_TOKENS_PER_SHARE,
  MINT_PRICE_ETH,
  MINT_TARGET_ETH,
  TOKENS_PER_SHARE,
} from '../config/contracts'
import { useMintCapUsd } from '../hooks/useEthUsdPrice'
import { SplitSection } from './SplitSection'

type MechanismsProps = {
  onNavigate: (id: string) => void
}

const HUB = { x: 500, y: 340 }

function MechanicsHub() {
  return (
    <div className="mechanisms-hub" aria-hidden>
      <svg className="mechanisms-hub-ring" viewBox="0 0 200 200" fill="none">
        <g className="mechanisms-hub-spin">
          <circle cx="100" cy="100" r="72" stroke="currentColor" strokeWidth="14" strokeOpacity="0.12" />
          <ellipse cx="100" cy="100" rx="74" ry="26" stroke="currentColor" strokeWidth="10" strokeOpacity="0.22" />
          <ellipse cx="100" cy="100" rx="26" ry="74" stroke="currentColor" strokeWidth="10" strokeOpacity="0.18" />
          <circle cx="62" cy="100" r="9" fill="currentColor" fillOpacity="0.85" />
          <circle cx="138" cy="100" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="71" y1="100" x2="129" y2="100" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  )
}

export function Mechanisms({ onNavigate }: MechanismsProps) {
  const { t } = useTranslation()
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)

  const MODULES = [
    {
      id: 'mint',
      tag: t('mechanisms.mint.tag'),
      body: t('mechanisms.mint.body', {
        price: MINT_PRICE_ETH,
        nullTokens: TOKENS_PER_SHARE.toLocaleString(),
        llnuTokens: LLNU_TOKENS_PER_SHARE.toLocaleString(),
        cap: MINT_TARGET_ETH,
        usd: mintCapUsd,
      }),
      cta: t('mechanisms.mint.cta'),
      nav: 'mint' as const,
      anchor: { x: 118, y: 88 },
      align: 'left' as const,
    },
    {
      id: 'burn',
      tag: t('mechanisms.burn.tag'),
      body: t('mechanisms.burn.body'),
      cta: t('mechanisms.burn.cta'),
      nav: 'strike' as const,
      anchor: { x: 882, y: 96 },
      align: 'right' as const,
    },
    {
      id: 'shield',
      tag: t('mechanisms.shield.tag'),
      body: t('mechanisms.shield.body', {
        month: CARD_MONTH_NULL.toLocaleString(),
        quarter: CARD_QUARTER_NULL.toLocaleString(),
        year: CARD_YEAR_NULL.toLocaleString(),
      }),
      cta: t('mechanisms.shield.cta'),
      nav: 'shield' as const,
      anchor: { x: 108, y: 612 },
      align: 'left' as const,
    },
    {
      id: 'liquidity',
      tag: t('mechanisms.liquidity.tag'),
      body: t('mechanisms.liquidity.body', { cap: MINT_TARGET_ETH }),
      cta: null,
      nav: null,
      anchor: { x: 892, y: 604 },
      align: 'right' as const,
    },
  ] as const

  return (
    <SplitSection
      id="mechanisms"
      eyebrow={t('mechanisms.eyebrow')}
      title={
        <>
          {t('mechanisms.title1')}
          <br />
          {t('mechanisms.title2')}
        </>
      }
      lead={t('mechanisms.lead')}
      className="split-section-mechanics"
    >
      <div className="mechanisms-orbit">
        <svg className="mechanisms-spokes" viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid meet">
          {MODULES.map((mod) => (
            <line
              key={mod.id}
              x1={HUB.x}
              y1={HUB.y}
              x2={mod.anchor.x}
              y2={mod.anchor.y}
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
          <rect x={HUB.x - 3} y={HUB.y - 3} width="6" height="6" fill="currentColor" />
          {MODULES.map((mod) => (
            <rect
              key={`${mod.id}-anchor`}
              x={mod.anchor.x - 3}
              y={mod.anchor.y - 3}
              width="6"
              height="6"
              fill="currentColor"
            />
          ))}
        </svg>

        <MechanicsHub />

        {MODULES.map((mod) => (
          <article
            key={mod.id}
            className={`mechanisms-node mechanisms-node-${mod.id} mechanics-node-${mod.align}`}
            style={
              {
                '--ax': `${(mod.anchor.x / 1000) * 100}%`,
                '--ay': `${(mod.anchor.y / 680) * 100}%`,
              } as CSSProperties
            }
          >
            {mod.nav ? (
              <button type="button" className="mechanisms-pill" onClick={() => onNavigate(mod.nav)}>
                <span>{mod.tag}</span>
                <span aria-hidden>→</span>
              </button>
            ) : (
              <span className="mechanisms-pill mechanics-pill-static">
                <span>{mod.tag}</span>
              </span>
            )}
            <p className="mechanisms-node-body">{mod.body}</p>
            {mod.cta && mod.nav && (
              <button type="button" className="mechanisms-link" onClick={() => onNavigate(mod.nav)}>
                {mod.cta} →
              </button>
            )}
          </article>
        ))}
      </div>
    </SplitSection>
  )
}
