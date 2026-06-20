import { useEffect, useState } from 'react'
import { getDisplayMintProgressPct } from '../config/contracts'

export function useDisplayMintProgress(): number {
  const [pct, setPct] = useState(() => getDisplayMintProgressPct())

  useEffect(() => {
    const tick = () => setPct(getDisplayMintProgressPct())
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  return pct
}
