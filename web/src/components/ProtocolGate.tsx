import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NETWORK_LABEL, TARGET_CHAIN_ID } from '../config/contracts'
import { useTargetChain } from '../hooks/useTargetChain'

type ProtocolGateProps = {
  title: string
  children: ReactNode
}

export function ProtocolGate({ title, children }: ProtocolGateProps) {
  const { t } = useTranslation()
  const { isConnected, isSwitching, protocolLive, isReady, onTargetChain } = useTargetChain()

  if (!isConnected) {
    return (
      <section className="panel">
        <h2>{title}</h2>
        <p className="muted">{t('protocolGate.connect', { network: NETWORK_LABEL })}</p>
      </section>
    )
  }

  if (!protocolLive) {
    return (
      <section className="panel panel-pending">
        <h2>{title}</h2>
        <p className="muted">{t('protocolGate.notConfigured')}</p>
      </section>
    )
  }

  if (isSwitching || !onTargetChain) {
    return (
      <section className="panel">
        <h2>{title}</h2>
        <p className="muted">
          {isSwitching
            ? t('protocolGate.switching', { network: NETWORK_LABEL })
            : t('protocolGate.switchWallet', {
                network: NETWORK_LABEL,
                chainId: TARGET_CHAIN_ID,
              })}
        </p>
      </section>
    )
  }

  if (!isReady) {
    return (
      <section className="panel">
        <h2>{title}</h2>
        <p className="muted">{t('protocolGate.confirm', { network: NETWORK_LABEL })}</p>
      </section>
    )
  }

  return <>{children}</>
}
