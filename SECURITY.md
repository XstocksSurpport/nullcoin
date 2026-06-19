# Security & Test Coverage

## Covered (automated tests)

| Area | Tests |
|------|--------|
| Uniswap v4 hook callbacks | `V4Hook.t.sol` |
| Mint cap / supply cap / 1:1 bonus | `NullMint.t.sol`, `Attack.t.sol`, `Fuzz.t.sol` |
| Auto liquidity at raise cap | `NullMint.t.sol` |
| Equal-token llnu strike | `LlnuStrike.t.sol`, `Fuzz.t.sol` |
| null P2P never strikes | `LlnuStrike.t.sol` |
| llnu DEX blocked (`P2P only` / `No liquidity`) | `LlnuStrike.t.sol`, `DexExemption.t.sol` |
| null DEX neutral zone | `DexExemption.t.sol` |
| Flash-loan mock attacks | `FlashLoan.t.sol` |
| Reentrancy during strike | `Attack.t.sol`, `FlashLoan.t.sol` |
| Admin endMint / no ETH withdrawal | `AdminSecurity.t.sol`, `NullMint.t.sol` |
| Unauthorized mint / burn | `Attack.t.sol` |
| Stake withdraw drain | `Attack.t.sol` |
| Fixed protection card burns + renewal | `NullHook.t.sol` |
| **Sepolia fork (live deployment)** | `SepoliaFork.t.sol` |
| **Sepolia on-chain E2E** | `script/TestnetFullVerify.s.sol` |

Run: `forge test`

Sepolia fork: `forge test --match-contract SepoliaForkTest --fork-url $SEPOLIA_RPC_URL`

Full test matrix: [docs/TEST_PLAN.md](docs/TEST_PLAN.md)

## Not covered / limitations

| Item | Status | Notes |
|------|--------|-------|
| Real Aave / dYdX flash loans | Not tested on-chain | `MockFlashLender` only |
| Uniswap v4 on live Sepolia pool | Partial | `NullLiquiditySeeder` tested via mint-cap integration test |
| Formal audit | Not done | — |
| Mainnet deployment | Not recommended | — |

## Admin permissions

Address: `0x9014c3e900A57e2C6082917Fc8EF779bC25433EA`

- `NullMint.endMint()` — closes public sale; seeds liquidity if cap reached
- Ownable on tokens / hook — configuration ownership

Admin **cannot**:

- `mint` tokens directly (minter is `NullMint` only)
- `burnFromStrike` user balances
- Withdraw accumulated mint ETH (stays in contract until auto LP seed)

## Strike mechanics

All strike and protection logic lives in **NullProtocolHook** (Uniswap v4 `IHooks`). `LlnuToken` calls `processLlnuStrike`; the hook burns `$null` via `burnFromStrike`. P2P burns **equal token counts**. `$llnu` cannot enter v4 pools (`beforeSwap` / `beforeAddLiquidity` revert).
