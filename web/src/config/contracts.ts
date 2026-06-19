import { mainnet, sepolia } from 'wagmi/chains'

const chainIdEnv = import.meta.env.VITE_CHAIN_ID
const useSepolia = chainIdEnv === '11155111' || chainIdEnv?.toLowerCase() === 'sepolia'

export const TARGET_CHAIN = useSepolia ? sepolia : mainnet
export const CHAINS = [TARGET_CHAIN] as const
export const TARGET_CHAIN_ID = TARGET_CHAIN.id
export const TARGET_CHAIN_NAME = useSepolia ? 'Sepolia' : 'Ethereum'
export const NETWORK_LABEL = useSepolia ? 'Sepolia Testnet' : 'Ethereum Mainnet'
export const EXPLORER_URL = useSepolia ? 'https://sepolia.etherscan.io' : 'https://etherscan.io'

const ZERO = '0x0000000000000000000000000000000000000000' as const

function envAddress(name: keyof ImportMetaEnv): `0x${string}` {
  const value = import.meta.env[name]
  if (typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)) {
    return value as `0x${string}`
  }
  return ZERO
}

export type ContractSet = {
  nullMint: `0x${string}`
  protocolHook: `0x${string}`
  nullToken: `0x${string}`
  llnuToken: `0x${string}`
  poolManager: `0x${string}`
}

const MAINNET_CONTRACTS: ContractSet = {
  nullMint: '0xc27E4564dC31e9d435CEeedf77cb7B5258C49F6F',
  protocolHook: '0x3c5A6c1cc1977bdfDa02E87d0CC7C45A69302aa0',
  nullToken: '0xE1Ef5457eD3775DE642aB039685fA28b01ad5CD9',
  llnuToken: '0xBBF966A45eBd71B9515099009b842E5B3c5A9C67',
  poolManager: '0x000000000004444c5dc75cB358380D2e3dE08A90',
}

const SEPOLIA_CONTRACTS: ContractSet = {
  nullMint: '0x5F321782b211b7e8fEe4fB503f9Ea164c0E9c331',
  protocolHook: '0x586bc977eEe28e154d91403203543b03E8346aa0',
  nullToken: '0xf24Df1a9e2b970B8BDe387f6Fb20E78F3f5beb4d',
  llnuToken: '0x07a63d25a0383720d7a0ff2f5d446F4b90Cbc874',
  poolManager: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
}

function resolveAddress(envKey: keyof ImportMetaEnv, fallback: `0x${string}`): `0x${string}` {
  const fromEnv = envAddress(envKey)
  return fromEnv !== ZERO ? fromEnv : fallback
}

function mainnetContracts(): ContractSet {
  // Mainnet addresses are source-of-truth in code; avoid stale .env overriding deploy.
  return { ...MAINNET_CONTRACTS }
}

function sepoliaContracts(): ContractSet {
  return {
    nullMint: resolveAddress('VITE_NULL_MINT', SEPOLIA_CONTRACTS.nullMint),
    protocolHook: resolveAddress('VITE_PROTOCOL_HOOK', SEPOLIA_CONTRACTS.protocolHook),
    nullToken: resolveAddress('VITE_NULL_TOKEN', SEPOLIA_CONTRACTS.nullToken),
    llnuToken: resolveAddress('VITE_LLNU_TOKEN', SEPOLIA_CONTRACTS.llnuToken),
    poolManager: resolveAddress('VITE_POOL_MANAGER', SEPOLIA_CONTRACTS.poolManager),
  }
}

export const CONTRACTS: Record<number, ContractSet> = {
  [mainnet.id]: mainnetContracts(),
  [sepolia.id]: sepoliaContracts(),
}

export const MINT_PRICE_ETH = 0.002
export const MAX_ETH_PER_ADDRESS = 0.1
export const MINT_TARGET_ETH = 4
export const TOKENS_PER_SHARE = 25_000
export const LLNU_PER_NULL = 2
export const LLNU_TOKENS_PER_SHARE = TOKENS_PER_SHARE * LLNU_PER_NULL
export const NULL_LP_ALLOCATION = 50_000_000
export const NULL_USER_ALLOCATION = 50_000_000
export const MAX_SUPPLY = 100_000_000
export const CARD_MONTH_NULL = 60_000
export const CARD_QUARTER_NULL = 160_000
export const CARD_YEAR_NULL = 460_000
export function getContracts(chainId: number): ContractSet | undefined {
  return CONTRACTS[chainId as keyof typeof CONTRACTS]
}

export function isProtocolLive(contracts?: ContractSet): boolean {
  if (!contracts) return false
  return contracts.nullMint !== ZERO
}

export function explorerAddress(address: string) {
  return `${EXPLORER_URL}/address/${address}`
}
