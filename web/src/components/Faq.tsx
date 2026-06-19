import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CARD_MONTH_NULL,
  CARD_QUARTER_NULL,
  CARD_YEAR_NULL,
  LLNU_TOKENS_PER_SHARE,
  MINT_TARGET_ETH,
  TOKENS_PER_SHARE,
} from '../config/contracts'
import { SplitSection } from './SplitSection'

const FAQ_KEYS = ['mint', 'dex', 'linkedBurn', 'protection'] as const

export function Faq() {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(null)

  const cardParams = {
    month: CARD_MONTH_NULL.toLocaleString(),
    quarter: CARD_QUARTER_NULL.toLocaleString(),
    year: CARD_YEAR_NULL.toLocaleString(),
    cap: MINT_TARGET_ETH,
    nullTokens: TOKENS_PER_SHARE.toLocaleString(),
    llnuTokens: LLNU_TOKENS_PER_SHARE.toLocaleString(),
  }

  return (
    <SplitSection
      id="faq"
      eyebrow={t('faq.eyebrow')}
      title={
        <>
          {t('faq.title1')}
          <br />
          {t('faq.title2')}
        </>
      }
    >
      <ul className="faq-stack">
        {FAQ_KEYS.map((key, i) => {
          const isOpen = open === i
          return (
            <li key={key} className={`faq-card${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="faq-card-btn"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span>{t(`faq.items.${key}.q`)}</span>
                <span className="faq-card-icon" aria-hidden>
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <p className="faq-card-a">{t(`faq.items.${key}.a`, cardParams)}</p>
              )}
            </li>
          )
        })}
      </ul>
    </SplitSection>
  )
}
