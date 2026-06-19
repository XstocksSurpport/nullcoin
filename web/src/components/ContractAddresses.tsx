import { useTranslation } from 'react-i18next'
import {
  EXPLORER_URL,
  NETWORK_LABEL,
  TARGET_CHAIN_ID,
  type ContractSet,
  getContracts,
  isProtocolLive,
  explorerAddress,
} from '../config/contracts'
import { SplitSection } from './SplitSection'

const LABELS: { key: keyof ContractSet; label: string }[] = [
  { key: 'nullMint', label: 'NullMint' },
  { key: 'protocolHook', label: 'Hook' },
  { key: 'nullToken', label: 'NullToken' },
  { key: 'llnuToken', label: 'LlnuToken' },
  { key: 'poolManager', label: 'PoolManager' },
]

export function ContractAddresses() {
  const { t } = useTranslation()
  const contracts = getContracts(TARGET_CHAIN_ID)
  const live = isProtocolLive(contracts)

  return (
    <SplitSection
      id="contracts"
      eyebrow={t('contracts.eyebrow')}
      title={
        <>
          {t('contracts.title1')}
          <br />
          {t('contracts.title2')}
        </>
      }
      lead={
        <>
          {t('contracts.lead', { network: NETWORK_LABEL })}{' '}
          <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="link">
            {t('contracts.etherscan')}
          </a>{' '}
          {t('contracts.leadSuffix')}
        </>
      }
    >
      {live && contracts ? (
        <ul className="contract-grid">
          {LABELS.map(({ key, label }) => (
            <li key={key} className="contract-card">
              <span className="contract-card-label">{label}</span>
              <a
                href={explorerAddress(contracts[key])}
                target="_blank"
                rel="noreferrer"
                className="contract-card-addr"
              >
                {contracts[key]}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="split-body-note">{t('contracts.pending')}</p>
      )}
    </SplitSection>
  )
}
