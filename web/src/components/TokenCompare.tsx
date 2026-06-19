import { useTranslation } from 'react-i18next'
import { SplitSection } from './SplitSection'
import { LLNU_PER_NULL } from '../config/contracts'

export function TokenCompare() {
  const { t } = useTranslation()

  const rows = [
    ['', t('tokenCompare.headerNull'), t('tokenCompare.headerLlnu')],
    [t('tokenCompare.role'), t('tokenCompare.roleNull'), t('tokenCompare.roleLlnu')],
    [t('tokenCompare.dex'), t('tokenCompare.dexNull'), t('tokenCompare.dexLlnu')],
    [t('tokenCompare.p2p'), t('tokenCompare.p2pNull'), t('tokenCompare.p2pLlnu')],
    [t('tokenCompare.protection'), t('tokenCompare.protectionNull'), t('tokenCompare.protectionLlnu')],
    [
      t('tokenCompare.mintRatio'),
      t('tokenCompare.mintRatioNull'),
      t('tokenCompare.mintRatioLlnu', { ratio: LLNU_PER_NULL }),
    ],
  ]

  return (
    <SplitSection
      eyebrow={t('tokenCompare.eyebrow')}
      title={
        <>
          {t('tokenCompare.title1')}
          <br />
          {t('tokenCompare.title2')}
        </>
      }
      lead={t('tokenCompare.lead')}
    >
      <div className="content-panel compare-panel">
        {rows.map((row, i) => (
          <div key={i} className={`compare-row ${i === 0 ? 'compare-head' : ''}`}>
            <span>{row[0]}</span>
            <span>{row[1]}</span>
            <span>{row[2]}</span>
          </div>
        ))}
      </div>
    </SplitSection>
  )
}
