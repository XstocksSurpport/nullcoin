// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
contract V4HookTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_beforeSwap_rejectsLlnuPool() public {
    PoolKey memory key = PoolKey({
      currency0: Currency.wrap(address(nullToken)),
      currency1: Currency.wrap(address(llnuToken)),
      fee: 3000,
      tickSpacing: 60,
      hooks: IHooks(address(hook))
    });

    vm.prank(poolManager);
    vm.expectRevert("No llnu liquidity");
    hook.beforeSwap(
      address(this), key, IPoolManager.SwapParams({zeroForOne: false, amountSpecified: 0, sqrtPriceLimitX96: 0}), bytes("")
    );
  }

  function test_beforeSwap_allowsNullOnlyPool() public {
    PoolKey memory key = PoolKey({
      currency0: Currency.wrap(address(nullToken)),
      currency1: Currency.wrap(address(0xdead)),
      fee: 3000,
      tickSpacing: 60,
      hooks: IHooks(address(hook))
    });

    vm.prank(poolManager);
    (bytes4 sel,,) =
      hook.beforeSwap(
      address(this), key, IPoolManager.SwapParams({zeroForOne: false, amountSpecified: 0, sqrtPriceLimitX96: 0}), bytes("")
    );
    assertEq(sel, IHooks.beforeSwap.selector);
  }

  function test_beforeAddLiquidity_rejectsLlnu() public {
    PoolKey memory key = PoolKey({
      currency0: Currency.wrap(address(llnuToken)),
      currency1: Currency.wrap(address(0xbeef)),
      fee: 3000,
      tickSpacing: 60,
      hooks: IHooks(address(hook))
    });

    vm.prank(poolManager);
    vm.expectRevert("No llnu liquidity");
    hook.beforeAddLiquidity(
      address(this),
      key,
      IPoolManager.ModifyLiquidityParams({
        tickLower: 0, tickUpper: 0, liquidityDelta: 0, salt: bytes32(0)
      }),
      bytes("")
    );
  }

  function test_beforeRemoveLiquidity_rejectsLlnu() public {
    PoolKey memory key = PoolKey({
      currency0: Currency.wrap(address(llnuToken)),
      currency1: Currency.wrap(address(0xbeef)),
      fee: 3000,
      tickSpacing: 60,
      hooks: IHooks(address(hook))
    });

    vm.prank(poolManager);
    vm.expectRevert("No llnu liquidity");
    hook.beforeRemoveLiquidity(
      address(this),
      key,
      IPoolManager.ModifyLiquidityParams({
        tickLower: 0, tickUpper: 0, liquidityDelta: 0, salt: bytes32(0)
      }),
      bytes("")
    );
  }

  function test_nonPoolManagerCannotCallBeforeSwap() public {
    PoolKey memory key = PoolKey({
      currency0: Currency.wrap(address(nullToken)),
      currency1: Currency.wrap(address(0xdead)),
      fee: 3000,
      tickSpacing: 60,
      hooks: IHooks(address(hook))
    });

    vm.expectRevert("Only PoolManager");
    hook.beforeSwap(
      address(this), key, IPoolManager.SwapParams({zeroForOne: false, amountSpecified: 0, sqrtPriceLimitX96: 0}), bytes("")
    );
  }
}
