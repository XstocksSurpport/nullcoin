import { createConfig } from '@privy-io/wagmi'
import { http, type Transport } from 'wagmi'
import { CHAINS, TARGET_CHAIN_ID } from './config/contracts'

const rpcUrl = import.meta.env.VITE_RPC_URL

export const config = createConfig({
  chains: CHAINS,
  transports: {
    [TARGET_CHAIN_ID]: http(rpcUrl || undefined),
  } as Record<(typeof CHAINS)[number]['id'], Transport>,
})
