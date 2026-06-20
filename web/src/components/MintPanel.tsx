import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseEther } from 'viem'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import {
  MINT_PRICE_ETH,
  MAX_ETH_PER_ADDRESS,
  LLNU_PER_NULL,
  LLNU_TOKENS_PER_SHARE,
  MINT_TARGET_ETH,
  TOKENS_PER_SHARE,
  explorerAddress,
} from '../config/contracts'
import { nullMintAbi } from '../abi/nullMint'
import { useMintCapUsd } from '../hooks/useEthUsdPrice'
import { useDisplayMintProgress } from '../hooks/useDisplayMintProgress'
import { useTargetChain } from '../hooks/useTargetChain'
import { ProtocolGate } from './ProtocolGate'

export function MintPanel() {
  const { t } = useTranslation()
  const { address, contracts } = useTargetChain()
  const [shares, setShares] = useState('1')

  const { data: mintEnded } = useReadContract({
    address: contracts?.nullMint,
    abi: nullMintAbi,
    functionName: 'mintEnded',
    query: { enabled: !!contracts },
  })

  const { data: liquiditySeeded } = useReadContract({
    address: contracts?.nullMint,
    abi: nullMintAbi,
    functionName: 'liquiditySeeded',
    query: { enabled: !!contracts },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const sharesNum = Math.max(1, parseInt(shares, 10) || 1)
  const ethCost = sharesNum * MINT_PRICE_ETH
  const tokensOut = sharesNum * TOKENS_PER_SHARE
  const llnuOut = tokensOut * LLNU_PER_NULL
  const progressPct = useDisplayMintProgress()
  const maxSharesPerWallet = MAX_ETH_PER_ADDRESS / MINT_PRICE_ETH
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)

  function handleMint() {
    if (!contracts) return
    writeContract({
      address: contracts.nullMint,
      abi: nullMintAbi,
      functionName: 'mint',
      args: [BigInt(sharesNum)],
      value: parseEther(ethCost.toString()),
    })
  }

  function statusMessage() {
    if (!mintEnded) return null
    if (liquiditySeeded) return t('mint.statusSeeded')
    return t('mint.statusNotSeeded')
  }

  const status = statusMessage()

  return (
    <ProtocolGate title={t('mint.title')}>
      <section className="panel">
        <h2>{t('mint.title')}</h2>
        <p className="muted">
          {t('mint.summary', {
            price: MINT_PRICE_ETH,
            nullTokens: TOKENS_PER_SHARE.toLocaleString(),
            llnuTokens: LLNU_TOKENS_PER_SHARE.toLocaleString(),
            maxEth: MAX_ETH_PER_ADDRESS,
            maxShares: maxSharesPerWallet,
          })}
        </p>
        {contracts && (
          <p className="muted mint-contract">
            NullMint:{' '}
            <a href={explorerAddress(contracts.nullMint)} target="_blank" rel="noreferrer" className="link">
              {contracts.nullMint}
            </a>
          </p>
        )}

        <div className="progress-block">
          <div className="summary-row">
            <span>{t('mint.raiseProgress')}</span>
            <strong>
              {t('mint.raiseCap', {
                pct: progressPct.toFixed(2),
                cap: MINT_TARGET_ETH,
                usd: mintCapUsd,
              })}
            </strong>
          </div>
          <div className="progress-bar" aria-hidden>
            <div className="progress-fill" style={{ width: `${Math.min(progressPct, 100)}%` }} />
          </div>
          {status && <p className="muted">{status}</p>}
        </div>

        <label className="field">
          <span>{t('mint.shares')}</span>
          <input
            type="number"
            min={1}
            max={maxSharesPerWallet}
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            disabled={!!mintEnded}
          />
        </label>

        <div className="summary-row">
          <span>{t('mint.pay')}</span>
          <strong>{ethCost} ETH</strong>
        </div>
        <div className="summary-row">
          <span>{t('mint.receiveNull')}</span>
          <strong>{tokensOut.toLocaleString()}</strong>
        </div>
        <div className="summary-row">
          <span>{t('mint.receiveLlnu')}</span>
          <strong>{llnuOut.toLocaleString()}</strong>
        </div>

        <p className="muted">{t('mint.liquidityNote', { cap: MINT_TARGET_ETH })}</p>

        <button
          type="button"
          className="btn-primary full"
          disabled={isPending || confirming || !address || !!mintEnded}
          onClick={handleMint}
        >
          {isPending || confirming
            ? t('mint.confirming')
            : mintEnded
              ? t('mint.ended')
              : t('mint.mint')}
        </button>

        {isSuccess && <p className="success">{t('mint.txConfirmed')}</p>}
        {error && <p className="error">{error.message.split('\n')[0]}</p>}
      </section>
    </ProtocolGate>
  )
}
