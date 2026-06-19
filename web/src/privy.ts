import type { PrivyClientConfig } from '@privy-io/react-auth'
import { CHAINS, TARGET_CHAIN } from './config/contracts'

export const PRIVY_APP_ID =
  import.meta.env.VITE_PRIVY_APP_ID ?? 'cmq8xavwq00dw0bjo5cj6slax'

/** Matches site `--bg` in index.css */
const SITE_BG = '#eae7d6'

export const privyConfig: PrivyClientConfig = {
  loginMethods: ['wallet', 'email'],
  appearance: {
    theme: SITE_BG,
    accentColor: '#0a0a0a',
    showWalletLoginFirst: true,
  },
  embeddedWallets: {
    ethereum: {
      // Avoid competing wallet flows during external MetaMask SIWE sign-in.
      createOnLogin: 'off',
    },
  },
  defaultChain: TARGET_CHAIN,
  supportedChains: [...CHAINS],
}
