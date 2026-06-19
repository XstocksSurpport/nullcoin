import { useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useConnection, useSwitchChain } from 'wagmi'
import { TARGET_CHAIN_ID } from '../config/contracts'

export function useAutoSwitchChain() {
  const { authenticated, ready } = usePrivy()
  const { isConnected, chainId } = useConnection()
  const { switchChain, isPending } = useSwitchChain()
  const attempted = useRef(false)

  useEffect(() => {
    // Wait until Privy SIWE finishes; switching chains mid-sign blocks MetaMask.
    if (!ready || !authenticated || !isConnected || chainId === TARGET_CHAIN_ID) {
      attempted.current = false
      return
    }
    if (attempted.current || isPending) return
    attempted.current = true
    switchChain(
      { chainId: TARGET_CHAIN_ID },
      { onSettled: () => { attempted.current = false } },
    )
  }, [ready, authenticated, isConnected, chainId, isPending, switchChain])

  const wrongChain =
    authenticated &&
    isConnected &&
    chainId !== undefined &&
    chainId !== TARGET_CHAIN_ID

  return { isSwitching: isPending || wrongChain }
}
