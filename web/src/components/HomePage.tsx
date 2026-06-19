import { useTranslation } from 'react-i18next'
import { Mechanisms } from './Mechanisms'
import { TokenCompare } from './TokenCompare'
import { ContractAddresses } from './ContractAddresses'
import { Faq } from './Faq'
import { Overview } from './Overview'
import { SplitSection } from './SplitSection'
import { NETWORK_LABEL } from '../config/contracts'

type HomePageProps = {
  onNavigate: (id: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useTranslation()

  return (
    <div className="home-page">
      <section className="snap-page snap-page-inner snap-page-split">
        <Mechanisms onNavigate={onNavigate} />
      </section>

      <section className="snap-page snap-page-inner snap-page-split">
        <TokenCompare />
      </section>

      <section className="snap-page snap-page-inner snap-page-split">
        <Faq />
      </section>

      <section className="snap-page snap-page-inner snap-page-split">
        <ContractAddresses />
      </section>

      <section id="portfolio" className="snap-page snap-page-inner snap-page-split">
        <SplitSection
          eyebrow={t('home.portfolioEyebrow')}
          title={
            <>
              {t('home.portfolioTitle1')}
              <br />
              {t('home.portfolioTitle2')}
            </>
          }
          lead={t('home.portfolioLead', { network: NETWORK_LABEL })}
        >
          <Overview />
        </SplitSection>
      </section>

      <section className="snap-page snap-page-inner snap-page-split">
        <SplitSection
          eyebrow={t('home.startEyebrow')}
          title={
            <>
              {t('home.startTitle1')}
              <br />
              {t('home.startTitle2')}
            </>
          }
        >
          <div className="split-actions">
            <button type="button" className="btn-primary" onClick={() => onNavigate('mint')}>
              {t('home.joinPresale')}
            </button>
            <button type="button" className="btn-outline" onClick={() => onNavigate('shield')}>
              {t('home.protection')}
            </button>
          </div>
        </SplitSection>
      </section>
    </div>
  )
}
