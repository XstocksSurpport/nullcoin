// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";
import {FullMath} from "v4-core/src/libraries/FullMath.sol";
import {FixedPoint96} from "v4-core/src/libraries/FixedPoint96.sol";
import {CurrencySettler} from "v4-core/test/utils/CurrencySettler.sol";

contract NullLiquiditySeeder is IUnlockCallback {
  using CurrencySettler for Currency;
  using StateLibrary for IPoolManager;

  IPoolManager public immutable poolManager;
  IHooks public immutable hooks;
  address public immutable nullToken;
  address public immutable hookOwner;

  int24 private constant TICK_LOWER = -120;
  int24 private constant TICK_UPPER = 120;
  uint24 private constant POOL_FEE = 3000;
  int24 private constant TICK_SPACING = 60;

  struct SeedData {
    address ethPayer;
    uint256 ethAmount;
    uint256 nullAmount;
    uint160 sqrtPriceX96;
  }

  constructor(IPoolManager _poolManager, IHooks _hooks, address _nullToken, address _hookOwner) {
    poolManager = _poolManager;
    hooks = _hooks;
    nullToken = _nullToken;
    hookOwner = _hookOwner;
  }

  function seed(uint256 nullAmount, uint160 sqrtPriceX96) external payable {
    require(msg.sender == hookOwner, "Only hook");
    require(msg.value > 0 && nullAmount > 0, "Zero liquidity");
    require(IERC20(nullToken).balanceOf(address(this)) >= nullAmount, "Insufficient null");
    poolManager.unlock(abi.encode(SeedData(msg.sender, msg.value, nullAmount, sqrtPriceX96)));
  }

  function unlockCallback(bytes calldata rawData) external returns (bytes memory) {
    require(msg.sender == address(poolManager), "Only PoolManager");

    SeedData memory data = abi.decode(rawData, (SeedData));
    PoolKey memory key = _poolKey();

    (uint160 sqrtPriceBefore,,,) = poolManager.getSlot0(key.toId());
    if (sqrtPriceBefore == 0) poolManager.initialize(key, data.sqrtPriceX96);

    (uint160 sqrtPriceX96,,,) = poolManager.getSlot0(key.toId());
    uint128 liquidity = _liquidityForAmounts(
      sqrtPriceX96,
      TickMath.getSqrtPriceAtTick(TICK_LOWER),
      TickMath.getSqrtPriceAtTick(TICK_UPPER),
      data.ethAmount,
      data.nullAmount
    );

    IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
      tickLower: TICK_LOWER,
      tickUpper: TICK_UPPER,
      liquidityDelta: int256(uint256(liquidity)),
      salt: bytes32(0)
    });

    (BalanceDelta delta,) = poolManager.modifyLiquidity(key, params, "");

    if (delta.amount0() < 0) {
      key.currency0.settle(poolManager, data.ethPayer, uint256(uint128(-delta.amount0())), false);
    }
    if (delta.amount1() < 0) {
      key.currency1.settle(poolManager, address(this), uint256(uint128(-delta.amount1())), false);
    }

    return "";
  }

  function poolKey() external view returns (PoolKey memory) {
    return _poolKey();
  }

  function _poolKey() internal view returns (PoolKey memory key) {
    key = PoolKey(Currency.wrap(address(0)), Currency.wrap(nullToken), POOL_FEE, TICK_SPACING, hooks);
  }

  function _liquidityForAmounts(
    uint160 sqrtPriceX96,
    uint160 sqrtPriceAX96,
    uint160 sqrtPriceBX96,
    uint256 amount0,
    uint256 amount1
  ) internal pure returns (uint128 liquidity) {
    if (sqrtPriceAX96 > sqrtPriceBX96) (sqrtPriceAX96, sqrtPriceBX96) = (sqrtPriceBX96, sqrtPriceAX96);

    if (sqrtPriceX96 <= sqrtPriceAX96) {
      return _liquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0);
    }
    if (sqrtPriceX96 < sqrtPriceBX96) {
      uint128 liq0 = _liquidityForAmount0(sqrtPriceX96, sqrtPriceBX96, amount0);
      uint128 liq1 = _liquidityForAmount1(sqrtPriceAX96, sqrtPriceX96, amount1);
      return liq0 < liq1 ? liq0 : liq1;
    }
    return _liquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1);
  }

  function _liquidityForAmount0(uint160 sqrtPriceAX96, uint160 sqrtPriceBX96, uint256 amount0)
    internal
    pure
    returns (uint128)
  {
    uint256 mid = FullMath.mulDiv(sqrtPriceAX96, sqrtPriceBX96, FixedPoint96.Q96);
    return _toUint128(FullMath.mulDiv(amount0, mid, sqrtPriceBX96 - sqrtPriceAX96));
  }

  function _liquidityForAmount1(uint160 sqrtPriceAX96, uint160 sqrtPriceBX96, uint256 amount1)
    internal
    pure
    returns (uint128)
  {
    return _toUint128(FullMath.mulDiv(amount1, FixedPoint96.Q96, sqrtPriceBX96 - sqrtPriceAX96));
  }

  function _toUint128(uint256 x) private pure returns (uint128 y) {
    require((y = uint128(x)) == x, "liquidity overflow");
  }
}
