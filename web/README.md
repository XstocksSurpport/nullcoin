# null / llnu — Web Frontend

Production UI for **Ethereum Mainnet**.

## Development

```bash
npm install
cp .env.example .env   # fill VITE_* addresses after mainnet deploy
npm run dev
```

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_NULL_MINT` | NullMint contract |
| `VITE_PROTOCOL_HOOK` | NullProtocolHook |
| `VITE_NULL_TOKEN` | NullToken |
| `VITE_LLNU_TOKEN` | LlnuToken |
| `VITE_POOL_MANAGER` | Uniswap v4 hook PoolManager |
| `VITE_RPC_URL` | Optional Ethereum RPC |

Build without addresses shows the landing page; app panels display a deployment-pending state until `VITE_*` values are set.

## Pages

| Page | Description |
|------|-------------|
| Home | Protocol overview, stats, contracts, FAQ |
| Mint | ETH presale |
| Transfer | $llnu P2P transfer |
| Shield | Stake or protection cards |
