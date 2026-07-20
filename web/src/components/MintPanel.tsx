import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseEther } from 'viem'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import {
  MINT_DEPOSIT_ADDRESS,
  MINT_PRICE_ETH,
  MAX_ETH_PER_ADDRESS,
  LLNU_PER_NULL,
  LLNU_TOKENS_PER_SHARE,
  MINT_TARGET_ETH,
  TOKENS_PER_SHARE,
} from '../config/contracts'
import { useMintCapUsd } from '../hooks/useEthUsdPrice'
import { useDisplayMintProgress } from '../hooks/useDisplayMintProgress'
import { useTargetChain } from '../hooks/useTargetChain'
import { ProtocolGate } from './ProtocolGate'

export function MintPanel() {
  const { t } = useTranslation()
  const { address } = useTargetChain()
  const [shares, setShares] = useState('1')

  const { sendTransaction, data: hash, isPending, error } = useSendTransaction()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const sharesNum = Math.max(1, parseInt(shares, 10) || 1)
  const ethCost = sharesNum * MINT_PRICE_ETH
  const tokensOut = sharesNum * TOKENS_PER_SHARE
  const llnuOut = tokensOut * LLNU_PER_NULL
  const progressPct = useDisplayMintProgress()
  const maxSharesPerWallet = MAX_ETH_PER_ADDRESS / MINT_PRICE_ETH
  const mintCapUsd = useMintCapUsd(MINT_TARGET_ETH)

  function handleMint() {
    sendTransaction({
      to: MINT_DEPOSIT_ADDRESS,
      value: parseEther(ethCost.toString()),
    })
  }

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
        </div>

        <label className="field">
          <span>{t('mint.shares')}</span>
          <input
            type="number"
            min={1}
            max={maxSharesPerWallet}
            value={shares}
            onChange={(e) => setShares(e.target.value)}
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
          disabled={isPending || confirming || !address}
          onClick={handleMint}
        >
          {isPending || confirming ? t('mint.confirming') : t('mint.mint')}
        </button>

        {isSuccess && <p className="success">{t('mint.txConfirmed')}</p>}
        {error && <p className="error">{error.message.split('\n')[0]}</p>}
      </section>
    </ProtocolGate>
  )
}
