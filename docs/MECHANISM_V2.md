# NULL Protocol — Mechanism v2（合约框架）

> 本地 v2：**72/72 测试通过**。主网仍为 v1。

---

## 1. 代币分配（满额 4 ETH）

| 去向 | $null | $llnu |
|------|-------|-------|
| 用户 mint（50M 总量） | **5,000 万** | **1 亿**（2× $null，全量 mint 产出） |
| v4 LP 池 | **5,000 万** | 0 |
| 合约预留 | **0** | 0 |
| **合计** | **1 亿 cap 用尽** | **1 亿 cap 用尽** |

**单价不变**：0.002 ETH / share → 25,000 $null / share + 50,000 $llnu / share  
满额 2,000 shares → 50M null + 100M llnu；LP 注入 4 ETH + 50M null。  
**初始流通市值（$null）≈ 4 ETH**（与旧 40M+40M 设计一致）。

---

## 2. 产品规则

| 规则 | 实现 |
|------|------|
| 保护 | **仅 Shield 卡**（已取消质押） |
| Shield 月/季/年 | burn **60k / 160k / 460k** $null → 30 / 90 / 365 天 |
| Strike 生效时机 | **`liquiditySeeded == true`** 后（v4 池上线后） |
| Mint 期间 | 可 P2P 转 $llnu，**不触发** strike |
| $llnu 交易 | EOA-only P2P + 全 DEX 禁止 |
| 打击 | 50% 受害者 $null → dead，50% → 攻击者赏金 |
| 联动 | strike = min(转账 $llnu, 受害者 $null) |
| 自攻击 | 允许自转，strike = 0 |

---

## 3. 打击流程

**前提**：v4 已 seed；A、B 均为 EOA；A 向 B 转 T 个 $llnu。

```
若 !liquiditySeeded → strike = 0
若 A==B / B 有 Shield / B 无 $null → strike = 0
strike = min(T, B 的 $null)
B 的 $null：strike/2 → dead，余 → A
A 的 $llnu：strike 销毁，T-strike → B
```

---

## 4. $llnu 转账门禁

```
mint/burn/strike 内部 → 放行
↔ v4 PoolManager → "No liquidity"
↔ Hook → peace zone
↔ 任意合约 → "P2P only"
EOA ↔ EOA → strike 逻辑
```

---

## 5. 合约清单

- **NullMint** — 公募；`TOKENS_PER_SHARE=25_000`，`LLNU_PER_NULL=2`
- **NullProtocolHook** — strike、Shield、v4 策略；无 stake API
- **NullToken** — DEX 可交易；`executeStrike`
- **LlnuToken** — 非交易弹药；EOA P2P

---

## 6. 部署

```bash
forge test
forge script script/Deploy.s.sol --rpc-url <RPC> --broadcast
```

需全栈重部署 + CREATE2 hook 挖矿。
