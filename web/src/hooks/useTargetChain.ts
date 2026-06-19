import { usePrivy } from '@privy-io/react-auth'
import { useConnection } from 'wagmi'
import {
  getContracts,
  isProtocolLive,
  TARGET_CHAIN_ID,
} from '../config/contracts'
import { useAutoSwitchChain } from './useAutoSwitchChain'

export function useTargetChain() {
  const { authenticated } = usePrivy()
  const { address, chainId, isConnected } = useConnection()
  const { isSwitching } = useAutoSwitchChain()

  const targetContracts = getContracts(TARGET_CHAIN_ID)
  const protocolLive = isProtocolLive(targetContracts)
  const onTargetChain = chainId === TARGET_CHAIN_ID
  const contracts = onTargetChain ? targetContracts : undefined
  const isReady = authenticated && isConnected && protocolLive && onTargetChain && !isSwitching

  return {
    address,
    chainId,
    isConnected,
    contracts: protocolLive && onTargetChain ? contracts : undefined,
    protocolLive,
    onTargetChain,
    isReady,
    isSwitching,
  }
}
