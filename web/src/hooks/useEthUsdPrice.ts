import { useQuery } from '@tanstack/react-query'

async function fetchEthUsd(): Promise<number> {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  )
  if (!res.ok) throw new Error('ETH price fetch failed')
  const data = (await res.json()) as { ethereum: { usd: number } }
  return data.ethereum.usd
}

export function useEthUsdPrice() {
  return useQuery({
    queryKey: ['eth-usd'],
    queryFn: fetchEthUsd,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
  })
}

export function formatUsdFromEth(eth: number, ethUsd?: number): string {
  if (!ethUsd || ethUsd <= 0) return '…'
  return Math.round(eth * ethUsd).toLocaleString()
}

export function useMintCapUsd(ethAmount: number): string {
  const { data: ethUsd } = useEthUsdPrice()
  return formatUsdFromEth(ethAmount, ethUsd)
}
