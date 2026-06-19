import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseUnits } from 'viem'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { erc20Abi } from '../abi/erc20'
import { protocolHookAbi } from '../abi/protocolHook'
import {
  CARD_MONTH_NULL,
  CARD_QUARTER_NULL,
  CARD_YEAR_NULL,
} from '../config/contracts'
import { useTargetChain } from '../hooks/useTargetChain'
import { ProtocolGate } from './ProtocolGate'

type CardType = 0 | 1 | 2

export function ShieldPanel() {
  const { t } = useTranslation()
  const { address, contracts } = useTargetChain()
  const [card, setCard] = useState<CardType>(0)
  const buyAfterApproveRef = useRef(false)

  const CARDS: { type: CardType; label: string; days: number; nullBurn: bigint }[] = [
    { type: 0, label: t('shield.monthly'), days: 30, nullBurn: parseUnits(String(CARD_MONTH_NULL), 18) },
    { type: 1, label: t('shield.quarterly'), days: 90, nullBurn: parseUnits(String(CARD_QUARTER_NULL), 18) },
    { type: 2, label: t('shield.annual'), days: 365, nullBurn: parseUnits(String(CARD_YEAR_NULL), 18) },
  ]

  const selected = CARDS[card]
  const cardCost = selected.nullBurn
  const cardAmountLabel = Number(cardCost / 10n ** 18n).toLocaleString()

  const { data: nullAllowance, refetch: refetchAllowance } = useReadContract({
    address: contracts?.nullToken,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && contracts ? [address, contracts.protocolHook] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract()

  const {
    writeContract: writeBuy,
    data: buyHash,
    isPending: buyPending,
    error: buyError,
    reset: resetBuy,
  } = useWriteContract()

  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash })
  const buyReceipt = useWaitForTransactionReceipt({ hash: buyHash })

  const needsNullApprove = nullAllowance === undefined || nullAllowance < cardCost

  const busy =
    approvePending ||
    approveReceipt.isLoading ||
    buyPending ||
    buyReceipt.isLoading

  function handlePurchase() {
    if (!contracts || busy) return
    resetApprove()
    resetBuy()
    buyAfterApproveRef.current = false

    if (needsNullApprove) {
      buyAfterApproveRef.current = true
      writeApprove({
        address: contracts.nullToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [contracts.protocolHook, cardCost],
      })
      return
    }

    writeBuy({
      address: contracts.protocolHook,
      abi: protocolHookAbi,
      functionName: 'buyProtection',
      args: [card],
    })
  }

  useEffect(() => {
    if (!buyAfterApproveRef.current || !approveReceipt.isSuccess || !contracts) return
    buyAfterApproveRef.current = false
    void refetchAllowance()
    writeBuy({
      address: contracts.protocolHook,
      abi: protocolHookAbi,
      functionName: 'buyProtection',
      args: [card],
    })
  }, [approveReceipt.isSuccess, card, contracts, refetchAllowance, writeBuy])

  function purchaseLabel() {
    if (approvePending || approveReceipt.isLoading) {
      return t('shield.approving', { amount: cardAmountLabel })
    }
    if (buyPending || buyReceipt.isLoading) {
      return t('shield.purchasing')
    }
    return t('shield.purchaseCard')
  }

  const error = approveError ?? buyError

  return (
    <ProtocolGate title={t('shield.title')}>
      <section className="panel">
        <h2>{t('shield.title')}</h2>
        <p className="muted">{t('shield.body')}</p>
        <p className="muted">{t('shield.cardNote')}</p>

        <div className="card-grid">
          {CARDS.map((c) => (
            <button
              key={c.type}
              type="button"
              className={`card-option ${card === c.type ? 'active' : ''}`}
              disabled={busy}
              onClick={() => setCard(c.type)}
            >
              <span className="card-title">{c.label}</span>
              <span className="card-days">
                {t('shield.cardDays', {
                  days: c.days,
                  amount: Number(c.nullBurn / 10n ** 18n).toLocaleString(),
                })}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-primary full shield-purchase-btn"
          disabled={busy}
          onClick={handlePurchase}
        >
          {purchaseLabel()}
        </button>

        {needsNullApprove && !busy && (
          <p className="muted shield-purchase-hint">
            {t('shield.purchaseHint', { amount: cardAmountLabel })}
          </p>
        )}

        {buyReceipt.isSuccess && <p className="success">{t('shield.txConfirmed')}</p>}
        {error && <p className="error">{error.message.split('\n')[0]}</p>}
      </section>
    </ProtocolGate>
  )
}
