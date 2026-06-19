// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {FullMath} from "v4-core/src/libraries/FullMath.sol";
import {FixedPoint96} from "v4-core/src/libraries/FixedPoint96.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {ProtocolBaseHook} from "./v4/ProtocolBaseHook.sol";
import {NullLiquiditySeeder} from "./v4/NullLiquiditySeeder.sol";
import {INullProtocolHook} from "./interfaces/INullProtocolHook.sol";
import {INullToken} from "./interfaces/INullToken.sol";

contract NullProtocolHook is ProtocolBaseHook, INullProtocolHook, Ownable {
  IPoolManager public immutable poolManager;

  address public nullToken;
  address public llnuToken;
  address public nullMint;
  NullLiquiditySeeder public liquiditySeeder;

  uint256 public constant CARD_MONTH_NULL = 60_000 * 10 ** 18;
  uint256 public constant CARD_QUARTER_NULL = 160_000 * 10 ** 18;
  uint256 public constant CARD_YEAR_NULL = 460_000 * 10 ** 18;
  address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
  uint256 public constant MINT_PRICE_ETH = 0.002 ether;
  uint256 public constant TOKENS_PER_SHARE = 25_000 * 10 ** 18;

  bool public liquiditySeeded;
  mapping(address => uint256) public protectionExpiry;

  event Protected(address indexed user, uint256 expiry);
  event StrikeExecuted(
    address indexed victim,
    address indexed striker,
    uint256 strikeAmount,
    uint256 nullToDead,
    uint256 nullBounty,
    uint256 llnuDelivered
  );
  event ProtectionPaid(address indexed user, uint8 cardType, uint256 nullBurned);
  event LiquiditySeeded(uint256 ethAmount, uint256 nullAmount);
  event MisdirectedTokensRecovered(address indexed token, address indexed to, uint256 amount);

  constructor(IPoolManager _poolManager, address initialOwner) Ownable(initialOwner) {
    poolManager = _poolManager;
    Hooks.validateHookPermissions(
      this,
      Hooks.Permissions({
        beforeInitialize: true,
        afterInitialize: false,
        beforeAddLiquidity: true,
        afterAddLiquidity: false,
        beforeRemoveLiquidity: true,
        afterRemoveLiquidity: false,
        beforeSwap: true,
        afterSwap: false,
        beforeDonate: true,
        afterDonate: false,
        beforeSwapReturnDelta: false,
        afterSwapReturnDelta: false,
        afterAddLiquidityReturnDelta: false,
        afterRemoveLiquidityReturnDelta: false
      })
    );
  }

  modifier onlyPoolManager() {
    require(msg.sender == address(poolManager), "Only PoolManager");
    _;
  }

  modifier onlyLlnuToken() {
    require(msg.sender == llnuToken, "Only llnu");
    _;
  }

  modifier onlyNullMint() {
    require(msg.sender == nullMint, "Only mint");
    _;
  }

  function setTokens(address _null, address _llnu) external onlyOwner {
    require(nullToken == address(0), "Already set");
    nullToken = _null;
    llnuToken = _llnu;
    liquiditySeeder = new NullLiquiditySeeder(poolManager, IHooks(address(this)), _null, address(this));
  }

  function setNullMint(address _nullMint) external onlyOwner {
    require(nullMint == address(0), "Already set");
    nullMint = _nullMint;
  }

  function beforeInitialize(address, PoolKey calldata key, uint160) external override onlyPoolManager returns (bytes4) {
    _assertNoLlnu(key);
    return IHooks.beforeInitialize.selector;
  }

  function beforeAddLiquidity(
    address,
    PoolKey calldata key,
    IPoolManager.ModifyLiquidityParams calldata,
    bytes calldata
  ) external override onlyPoolManager returns (bytes4) {
    _assertNoLlnu(key);
    return IHooks.beforeAddLiquidity.selector;
  }

  function beforeRemoveLiquidity(
    address,
    PoolKey calldata key,
    IPoolManager.ModifyLiquidityParams calldata,
    bytes calldata
  ) external override onlyPoolManager returns (bytes4) {
    _assertNoLlnu(key);
    return IHooks.beforeRemoveLiquidity.selector;
  }

  function beforeDonate(address, PoolKey calldata key, uint256, uint256, bytes calldata)
    external
    override
    onlyPoolManager
    returns (bytes4)
  {
    _assertNoLlnu(key);
    return IHooks.beforeDonate.selector;
  }

  function beforeSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, bytes calldata)
    external
    override
    onlyPoolManager
    returns (bytes4, BeforeSwapDelta, uint24)
  {
    _assertNoLlnu(key);
    return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
  }

  function finalizeMintAndSeedLiquidity(uint256 nullAmount) external payable onlyNullMint {
    require(!liquiditySeeded, "Already seeded");
    require(msg.value > 0 && nullAmount > 0, "Zero liquidity");

    liquiditySeeded = true;
    IERC20(nullToken).transfer(address(liquiditySeeder), nullAmount);
    liquiditySeeder.seed{value: msg.value}(nullAmount, _mintSqrtPriceX96());
    emit LiquiditySeeded(msg.value, nullAmount);
  }

  function processLlnuStrike(address striker, address victim, uint256 amount)
    external
    onlyLlnuToken
    returns (uint256 strikeAmount)
  {
    if (!liquiditySeeded || striker == victim || isProtected(victim)) return 0;

    uint256 victimNull = IERC20(nullToken).balanceOf(victim);
    if (victimNull == 0) return 0;

    strikeAmount = amount < victimNull ? amount : victimNull;
    uint256 nullToDead = strikeAmount / 2;
    uint256 nullBounty = strikeAmount - nullToDead;

    INullToken(nullToken).executeStrike(victim, striker, strikeAmount);
    emit StrikeExecuted(victim, striker, strikeAmount, nullToDead, nullBounty, amount - strikeAmount);
  }

  function isHookPeaceZone(address from, address to) external view returns (bool) {
    return from == address(this) || to == address(this);
  }

  function recoverMisdirectedTokens(address token, address to) external onlyOwner {
    require(token == nullToken || token == llnuToken, "Invalid token");
    require(to != address(0), "Zero address");
    uint256 balance = IERC20(token).balanceOf(address(this));
    require(balance > 0, "No excess");
    IERC20(token).transfer(to, balance);
    emit MisdirectedTokensRecovered(token, to, balance);
  }

  function buyProtection(uint8 cardType) external {
    (uint256 cost, uint256 duration) = _cardTerms(cardType);
    IERC20(nullToken).transferFrom(msg.sender, BURN_ADDRESS, cost);

    uint256 expiry = protectionExpiry[msg.sender];
    expiry = expiry < block.timestamp ? block.timestamp + duration : expiry + duration;
    protectionExpiry[msg.sender] = expiry;

    emit Protected(msg.sender, expiry);
    emit ProtectionPaid(msg.sender, cardType, cost);
  }

  function isProtected(address user) public view returns (bool) {
    return protectionExpiry[user] > block.timestamp;
  }

  function _assertNoLlnu(PoolKey calldata key) internal view {
    address c0 = Currency.unwrap(key.currency0);
    address c1 = Currency.unwrap(key.currency1);
    require(c0 != llnuToken && c1 != llnuToken, "No llnu liquidity");
  }

  function _cardTerms(uint8 cardType) internal pure returns (uint256 cost, uint256 duration) {
    if (cardType == 0) return (CARD_MONTH_NULL, 30 days);
    if (cardType == 1) return (CARD_QUARTER_NULL, 90 days);
    if (cardType == 2) return (CARD_YEAR_NULL, 365 days);
    revert("Invalid type");
  }

  function _mintSqrtPriceX96() internal pure returns (uint160) {
    uint256 priceX192 = FullMath.mulDiv(TOKENS_PER_SHARE, FixedPoint96.Q96, MINT_PRICE_ETH);
    priceX192 = FullMath.mulDiv(priceX192, FixedPoint96.Q96, 1);
    return uint160(_sqrt(priceX192));
  }

  function _sqrt(uint256 x) internal pure returns (uint256 y) {
    if (x == 0) return 0;
    y = x;
    uint256 z = (x + 1) / 2;
    while (z < y) {
      y = z;
      z = (x / z + z) / 2;
    }
  }
}
