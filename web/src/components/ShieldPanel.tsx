import { useState } from 'react'
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

const MAX_CARD_BURN = parseUnits(String(CARD_YEAR_NULL), 18)

export function ShieldPanel() {
  const { t } = useTranslation()
  const { address, contracts } = useTargetChain()
  const [card, setCard] = useState<CardType>(0)

  const CARDS: { type: CardType; label: string; days: number; nullBurn: bigint }[] = [
    { type: 0, label: t('shield.monthly'), days: 30, nullBurn: parseUnits(String(CARD_MONTH_NULL), 18) },
    { type: 1, label: t('shield.quarterly'), days: 90, nullBurn: parseUnits(String(CARD_QUARTER_NULL), 18) },
    { type: 2, label: t('shield.annual'), days: 365, nullBurn: parseUnits(String(CARD_YEAR_NULL), 18) },
  ]

  const cardCost = CARDS[card].nullBurn

  const { data: nullAllowance } = useReadContract({
    address: contracts?.nullToken,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && contracts ? [address, contracts.protocolHook] : undefined,
    query: { enabled: !!address && !!contracts },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function handleBuyCard() {
    if (!contracts) return
    writeContract({
      address: contracts.protocolHook,
      abi: protocolHookAbi,
      functionName: 'buyProtection',
      args: [card],
    })
  }

  function handleApproveNull() {
    if (!contracts) return
    writeContract({
      address: contracts.nullToken,
      abi: erc20Abi,
      functionName: 'approve',
      args: [contracts.protocolHook, MAX_CARD_BURN],
    })
  }

  const needsNullApprove = nullAllowance === undefined || nullAllowance < cardCost

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

        {needsNullApprove && (
          <button
            type="button"
            className="btn-ghost full"
            disabled={isPending || confirming}
            onClick={handleApproveNull}
          >
            {t('shield.approveNull')}
          </button>
        )}

        <button
          type="button"
          className="btn-primary full"
          disabled={isPending || confirming || needsNullApprove}
          onClick={handleBuyCard}
        >
          {t('shield.purchaseCard')}
        </button>

        {isSuccess && <p className="success">{t('shield.txConfirmed')}</p>}
        {error && <p className="error">{error.message.split('\n')[0]}</p>}
      </section>
    </ProtocolGate>
  )
}
