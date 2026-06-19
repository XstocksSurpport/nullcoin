/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN_ID?: string
  readonly VITE_NULL_MINT?: string
  readonly VITE_PROTOCOL_HOOK?: string
  readonly VITE_NULL_TOKEN?: string
  readonly VITE_LLNU_TOKEN?: string
  readonly VITE_POOL_MANAGER?: string
  readonly VITE_RPC_URL?: string
  readonly VITE_PRIVY_APP_ID?: string
  readonly VITE_X_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
