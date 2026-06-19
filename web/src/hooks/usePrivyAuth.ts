import { useCallback, useState } from 'react'
import { usePrivy, useActiveWallet } from '@privy-io/react-auth'
import { useDisconnect } from 'wagmi'

export function usePrivyAuth() {
  const { ready, authenticated, login, logout, connectWallet } = usePrivy()
  const { wallet } = useActiveWallet()
  const { disconnect } = useDisconnect()
  const [pending, setPending] = useState(false)

  const address = authenticated ? wallet?.address : undefined
  const linked = ready && authenticated

  const connect = useCallback(() => {
    if (!ready || pending) return
    if (authenticated) {
      connectWallet()
      return
    }
    login({ loginMethods: ['wallet'] })
  }, [ready, pending, authenticated, connectWallet, login])

  const disconnectAll = useCallback(async () => {
    if (!ready || pending || !authenticated) return
    setPending(true)
    try {
      disconnect()
      await logout()
    } catch {
      // Session may already be cleared; wagmi disconnect above still resets UI.
    } finally {
      setPending(false)
    }
  }, [ready, pending, authenticated, disconnect, logout])

  return {
    ready,
    linked,
    address,
    pending,
    connect,
    disconnect: disconnectAll,
  }
}
