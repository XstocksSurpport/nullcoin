# 协议测试方案（Test Plan）

> 以链上合约 + `forge test` 为准。Sepolia 地址见 [GUIDE.md](./GUIDE.md)。

## 1. 机制矩阵

| # | 机制 | 合约入口 | 预期行为 | 自动化测试 | Sepolia 验证 |
|---|------|----------|----------|------------|--------------|
| M1 | ETH 铸造 | `NullMint.mint` | 0.002 ETH/份 → 20k null + 20k llnu | `NullMint.t.sol` | `SepoliaFork` / `TestnetFullVerify` |
| M2 | 单地址上限 | `NullMint.mint` | 每地址 ≤ 0.1 ETH | `NullMint.t.sol`, `Fuzz.t.sol` | fork mint |
| M3 | 总募集上限 | `NullMint.mint` | 总 ETH ≤ 4 ETH | `NullMint.t.sol`, `Attack.t.sol` | 常量检查 |
| M4 | 满额自动上池 | `_seedLiquidity` | 4 ETH 时 mint null 给 hook → v4 加池 | `NullMint.t.sol` | 需满额 E2E（可选） |
| M5 | llnu P2P 联动销毁 | `LlnuToken.transfer` → `processLlnuStrike` | 1:1 销毁接收方 null + 发送方等量 llnu | `LlnuStrike.t.sol`, `Fuzz.t.sol` | `TestnetFullVerify` |
| M6 | 受害者零签名 | `burnFromStrike` | 仅 hook 可调用，受害者无需 approve | `LlnuStrike.t.sol` | E2E strike |
| M7 | null P2P 不触发 | `NullToken.transfer` | 普通转账，无 strike | `LlnuStrike.t.sol` | — |
| M8 | null DEX 中立 | → PoolManager | 可转入 PM，不 strike | `DexExemption.t.sol` | `SepoliaFork` |
| M9 | llnu 禁止入池 | `beforeSwap` / `beforeAddLiquidity` | revert `No llnu liquidity` | `V4Hook.t.sol`, `DexExemption.t.sol` | `SepoliaFork` |
| M10 | 质押防护 | `stakeForProtection` | `isProtected` = true | `NullHook.t.sol`, `LlnuStrike.t.sol` | fork stake path |
| M11 | 防护卡（固定销毁） | `buyProtection` | 月 120k / 季 320k / 年 920k null → dead | `NullHook.t.sol` | `SepoliaFork`, E2E |
| M12 | 防护卡续费 | `buyProtection` | 未过期时在原 expiry 上累加 | `NullHook.t.sol` | — |
| M13 | 防护中免 strike | `isProtected` | 接收 llnu 不烧 null | `NullHook.t.sol`, `Attack.t.sol` | E2E |
| M14 | 取消质押 | `withdrawProtection` | 余额归零后 `isStaked` = false | `NullHook.t.sol` | — |
| M15 | 管理员 endMint | `NullMint.endMint` | 仅 ADMIN；满额则 seed | `AdminSecurity.t.sol` | — |
| M16 | 非授权 mint/burn | `mint` / `burnFromStrike` | revert | `Attack.t.sol`, `AdminSecurity.t.sol` | fork admin test |
| M17 | 重入 | strike 回调 | 正常完成，无双花 | `Attack.t.sol`, `FlashLoan.t.sol` | — |
| M18 | 闪电贷绕过 cap | flash mint | revert 超 cap | `FlashLoan.t.sol` | — |
| M19 | Hook CREATE2 权限位 | 部署地址 | v4 permission flags 匹配 | `SepoliaFork.t.sol` | 部署日志 |
| M20 | 部署 wiring | configure / setTokens | 各合约地址互指正确 | `SepoliaFork.t.sol` | `TestnetFullVerify` |

## 2. 执行命令

```bash
# 本地全量（约 56+ 项）
forge test

# Sepolia fork（需 RPC）
forge test --match-contract SepoliaForkTest --fork-url $SEPOLIA_RPC_URL -vv

# 链上 E2E（需私钥 + 新部署地址）
NULL_MINT=0x... PROTOCOL_HOOK=0x... NULL_TOKEN=0x... LLNU_TOKEN=0x... \
WALLET_A_KEY=0x... WALLET_B_KEY=0x... \
forge script script/TestnetFullVerify.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --slow
```

## 3. 手动 / 前端抽检

| 步骤 | 操作 | 通过标准 |
|------|------|----------|
| F1 | Mint 面板 mint 1 份 | 收到 20k null + 20k llnu |
| F2 | Transfer 面板转 10 llnu | 对方 null 减少 10（若未防护） |
| F3 | Shield 购买月卡 | 销毁 120,000 null，显示 protected |
| F4 | Overview 余额 | 与链上一致 |

## 4. 已知未覆盖项

- 真实 Aave/dYdX 闪电贷（仅 MockFlashLender）
- 满额 4 ETH 后 live v4 swap 全流程（本地 `test_autoSeedLiquidityAtCap` 已覆盖逻辑）
- 正式第三方审计

## 5. 回归清单（每次改合约后）

1. `forge test` 全绿
2. 更新 `SepoliaFork.t.sol` 地址（若 redeploy）
3. `forge test --match-contract SepoliaForkTest --fork-url ...`
4. `TestnetFullVerify.s.sol` broadcast
5. 更新 `README.md` / `GUIDE.md` / `web/.env` 地址
