# null / llnu

双代币协议：`$null` 为主代币（可交易），`$llnu` 为配对代币（P2P 转账可触发接收方 `$null` 的 1:1 销毁）。

## Quick start

```bash
forge test

# Local
anvil
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Mainnet
V4_POOL_MANAGER=0x000000000004444c5dc75cB358380D2e3dE08A90 \
forge script script/Deploy.s.sol --rpc-url $ETH_RPC --broadcast --slow

# Sepolia
V4_POOL_MANAGER=0xE03A1074c86CFeDd5C142C4F04F1a1536e203543 \
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC --broadcast

cd web && npm install && cp .env.example .env && npm run dev
```

## Documentation

**[完整协议指南（中文）](docs/GUIDE.md)**

## Admin

`0xeB9c027FA55cEe6D722177f06441B451961731FC` — `endMint()`、`withdrawEth()`（NullMint）

## Ethereum Mainnet

| Contract | Address |
|----------|---------|
| NullMint | `0x5F321782b211b7e8fEe4fB503f9Ea164c0E9c331` |
| NullProtocolHook | `0x1228aAa748b2e4713aa15F193B10961932e5EAa0` |
| NullToken | `0xf24Df1a9e2b970B8BDe387f6Fb20E78F3f5beb4d` |
| LlnuToken | `0x07a63d25a0383720d7a0ff2f5d446F4b90Cbc874` |
| PoolManager | `0x000000000004444c5dc75cB358380D2e3dE08A90` |

Admin: `0xeB9c027FA55cEe6D722177f06441B451961731FC`

## Web

官网已配置 **Ethereum Mainnet** 合约地址（见 `web/.env`）。

## Layout

```
src/NullProtocolHook.sol   — v4 hook + protocol rules
src/NullMint.sol             — ETH sale, admin withdraw, auto LP at cap
web/                         — React frontend
docs/GUIDE.md                — Full guide (中文)
docs/TEST_PLAN.md            — Mechanism test matrix
```

Experimental, not audited. Use at your own risk.
