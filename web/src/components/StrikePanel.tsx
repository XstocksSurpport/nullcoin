import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAddress, parseUnits } from 'viem'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { erc20Abi } from '../abi/erc20'
import { protocolHookAbi } from '../abi/protocolHook'
import { useTargetChain } from '../hooks/useTargetChain'
import { ProtocolGate } from './ProtocolGate'

export function StrikePanel() {
  const { t } = useTranslation()
  const { contracts } = useTargetChain()
  const [target, setTarget] = useState('')
  const [amount, setAmount] = useState('1000')

  const { data: liquiditySeeded } = useReadContract({
    address: contracts?.protocolHook,
    abi: protocolHookAbi,
    functionName: 'liquiditySeeded',
    query: { enabled: !!contracts },
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const validTarget = isAddress(target)
  const strikeActive = liquiditySeeded === true

  function handleTransfer() {
    if (!contracts || !validTarget) return
    writeContract({
      address: contracts.llnuToken,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [target as `0x${string}`, parseUnits(amount || '0', 18)],
    })
  }

  return (
    <ProtocolGate title={t('strike.title')}>
      <section className="panel">
        <h2>{t('strike.title')}</h2>
        <p className="muted">{t('strike.body')}</p>
        {liquiditySeeded === false && (
          <p className="muted">{t('strike.inactiveUntilSeed')}</p>
        )}

        <label className="field">
          <span>{t('strike.recipient')}</span>
          <input
            type="text"
            placeholder={t('strike.placeholder')}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>

        <label className="field">
          <span>{t('strike.amount')}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="btn-primary full"
          disabled={isPending || confirming || !validTarget || !strikeActive}
          onClick={handleTransfer}
        >
          {isPending || confirming ? t('strike.confirming') : t('strike.send')}
        </button>

        {isSuccess && <p className="success">{t('strike.txConfirmed')}</p>}
        {error && <p className="error">{error.message.split('\n')[0]}</p>}
      </section>
    </ProtocolGate>
  )
}
