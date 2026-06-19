import { useTranslation } from 'react-i18next'
import { useReadContracts } from 'wagmi'
import { formatEther, formatUnits } from 'viem'
import { erc20Abi } from '../abi/erc20'
import { nullMintAbi } from '../abi/nullMint'
import { protocolHookAbi } from '../abi/protocolHook'
import { useTargetChain } from '../hooks/useTargetChain'
import { ProtocolGate } from './ProtocolGate'

export function Overview() {
  const { t, i18n } = useTranslation()
  const { address, contracts } = useTargetChain()

  const { data, isLoading, refetch } = useReadContracts({
    contracts:
      address && contracts
        ? [
            { address: contracts.nullToken, abi: erc20Abi, functionName: 'balanceOf', args: [address] },
            { address: contracts.llnuToken, abi: erc20Abi, functionName: 'balanceOf', args: [address] },
            { address: contracts.nullMint, abi: nullMintAbi, functionName: 'ethSpent', args: [address] },
            { address: contracts.protocolHook, abi: protocolHookAbi, functionName: 'isProtected', args: [address] },
            { address: contracts.protocolHook, abi: protocolHookAbi, functionName: 'protectionExpiry', args: [address] },
          ]
        : [],
    query: { enabled: !!address && !!contracts },
  })

  const nullBal = data?.[0]?.result
  const llnuBal = data?.[1]?.result
  const ethSpent = data?.[2]?.result
  const protected_ = data?.[3]?.result
  const expiry = data?.[4]?.result

  const expiryDate =
    expiry && expiry > 0n
      ? new Date(Number(expiry) * 1000).toLocaleDateString(i18n.language)
      : '—'

  return (
    <ProtocolGate title={t('pages.dashboard')}>
      <div className="panel">
        <div className="panel-head">
          <h2>{t('overview.balances')}</h2>
          <button type="button" className="btn-ghost" onClick={() => refetch()}>
            {t('overview.refresh')}
          </button>
        </div>

        {isLoading ? (
          <p className="muted">{t('overview.loading')}</p>
        ) : (
          <div className="stat-grid">
            <div>
              <span className="stat-label">$null</span>
              <span className="stat-value">{nullBal !== undefined ? formatToken(nullBal) : '—'}</span>
            </div>
            <div>
              <span className="stat-label">$llnu</span>
              <span className="stat-value">{llnuBal !== undefined ? formatToken(llnuBal) : '—'}</span>
            </div>
            <div>
              <span className="stat-label">{t('overview.ethContributed')}</span>
              <span className="stat-value">{ethSpent !== undefined ? formatEther(ethSpent) : '—'}</span>
            </div>
            <div>
              <span className="stat-label">{t('overview.protection')}</span>
              <span className={`stat-value ${protected_ ? 'safe' : 'danger'}`}>
                {protected_ ? t('overview.active') : t('overview.inactive')}
              </span>
              {protected_ && expiry && expiry > 0n && (
                <span className="stat-sub">{t('overview.until', { date: expiryDate })}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtocolGate>
  )
}

function formatToken(amount: bigint) {
  const n = Number(formatUnits(amount, 18))
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}
