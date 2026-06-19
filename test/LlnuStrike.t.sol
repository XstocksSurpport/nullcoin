// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {MockDexPool} from "./mocks/MockDexPool.sol";

contract LlnuStrikeTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_nullP2P_noAnnihilation() public {
    _mint(walletA, 5);
    _mint(walletB, 3);

    vm.prank(walletA);
    nullToken.transfer(walletB, 100 ether);

    assertEq(nullToken.balanceOf(walletB), 3 * nullMint.TOKENS_PER_SHARE() + 100 ether);
    assertEq(llnuToken.balanceOf(walletB), _llnuForShares(3));
  }

  function test_strikeInactiveBeforeLiquiditySeeded() public {
    _mint(walletA, 5);
    _mint(walletB, 3);
    assertFalse(hook.liquiditySeeded());

    uint256 nullBefore = nullToken.balanceOf(walletB);
    vm.prank(walletA);
    llnuToken.transfer(walletB, 1000 ether);

    assertEq(nullToken.balanceOf(walletB), nullBefore);
  }

  function test_strike_splitsNullHalfDeadHalfBounty() public {
    _mint(walletB, 3);
    _mint(walletA, 10);
    _activateStrikes();

    uint256 victimNull = nullToken.balanceOf(walletB);
    uint256 victimLlnuBefore = llnuToken.balanceOf(walletB);
    uint256 strikerNullBefore = nullToken.balanceOf(walletA);
    uint256 deadBefore = nullToken.balanceOf(BURN_ADDRESS);
    uint256 strikeAmount = 100 ether;

    vm.prank(walletA);
    llnuToken.transfer(walletB, strikeAmount);

    uint256 expectedStrike = strikeAmount < victimNull ? strikeAmount : victimNull;
    uint256 expectedDead = expectedStrike / 2;
    uint256 expectedBounty = expectedStrike - expectedDead;

    assertEq(nullToken.balanceOf(walletB), victimNull - expectedStrike);
    assertEq(nullToken.balanceOf(walletA), strikerNullBefore + expectedBounty);
    assertEq(nullToken.balanceOf(BURN_ADDRESS), deadBefore + expectedDead);
    assertEq(llnuToken.balanceOf(walletB), victimLlnuBefore + strikeAmount - expectedStrike);
  }

  function test_victimNeverSigns_passiveNullStrike() public {
    _mint(walletB, 3);
    _mint(walletA, 5);
    _activateStrikes();
    uint256 before = nullToken.balanceOf(walletB);

    vm.prank(walletA);
    llnuToken.transfer(walletB, 60 ether);

    assertLt(nullToken.balanceOf(walletB), before);
  }

  function test_selfTransfer_noStrikeNoBounty() public {
    _mint(walletA, 5);
    uint256 nullBefore = nullToken.balanceOf(walletA);
    uint256 llnuBefore = llnuToken.balanceOf(walletA);

    vm.prank(walletA);
    llnuToken.transfer(walletA, 500 ether);

    assertEq(nullToken.balanceOf(walletA), nullBefore);
    assertEq(llnuToken.balanceOf(walletA), llnuBefore);
  }

  function test_nullTransferNeverStrikes() public {
    _mint(walletB, 3);
    _mint(walletA, 10);

    uint256 victimLlnu = llnuToken.balanceOf(walletB);
    uint256 strikeNull = 100_000 * 10 ** 18;

    vm.prank(walletA);
    nullToken.transfer(walletB, strikeNull);

    assertEq(llnuToken.balanceOf(walletB), victimLlnu);
    assertEq(nullToken.balanceOf(walletB), 3 * nullMint.TOKENS_PER_SHARE() + strikeNull);
  }

  function test_llnuCannotUseV4PoolManager() public {
    _mint(walletA, 5);

    vm.prank(walletA);
    vm.expectRevert("No liquidity");
    llnuToken.transfer(poolManager, 100 ether);
  }

  function test_llnuCannotTransferToDexPool() public {
    _mint(walletA, 5);
    MockDexPool pool = new MockDexPool();

    vm.prank(walletA);
    vm.expectRevert("P2P only");
    llnuToken.transfer(address(pool), 100 ether);
  }

  function test_llnuCannotTransferFromContract() public {
    _mint(walletA, 5);
    MockDexPool router = new MockDexPool();

    vm.prank(address(router));
    vm.expectRevert("P2P only");
    llnuToken.transfer(walletB, 1 ether);
  }

  function test_llnuMisdirectToHook_recoverable() public {
    _mint(walletA, 5);
    uint256 amount = 1_000 ether;

    vm.prank(walletA);
    llnuToken.transfer(address(hook), amount);
    assertEq(llnuToken.balanceOf(address(hook)), amount);

    hook.recoverMisdirectedTokens(address(llnuToken), walletB);
    assertEq(llnuToken.balanceOf(walletB), amount);
  }

  function test_nullCanUseDex() public {
    _mint(walletA, 5);
    _mint(walletB, 5);

    vm.prank(walletA);
    nullToken.transfer(poolManager, 1000 ether);

    assertEq(nullToken.balanceOf(poolManager), 1000 ether);
  }

  function test_cardProtection_blocksStrike() public {
    _mint(walletB, 10);
    _mint(walletA, 10);
    _activateStrikes();

    uint256 cardCost = hook.CARD_MONTH_NULL();
    vm.startPrank(walletB);
    nullToken.approve(address(hook), cardCost);
    hook.buyProtection(0);
    vm.stopPrank();

    vm.prank(walletA);
    llnuToken.transfer(walletB, 1000 ether);

    assertEq(nullToken.balanceOf(walletB), 10 * nullMint.TOKENS_PER_SHARE() - cardCost);
    assertEq(llnuToken.balanceOf(walletB), _llnuForShares(10) + 1000 ether);
  }

  function test_executeStrike_onlyHook() public {
    _mint(walletB, 1);
    vm.prank(walletA);
    vm.expectRevert("Only hook");
    nullToken.executeStrike(walletB, walletA, 1);
  }

  function test_strikeExecutedEvent() public {
    _mint(walletB, 3);
    _mint(walletA, 5);
    _activateStrikes();

    vm.expectEmit(true, true, false, true);
    emit NullProtocolHook.StrikeExecuted(walletB, walletA, 60 ether, 30 ether, 30 ether, 0);

    vm.prank(walletA);
    llnuToken.transfer(walletB, 60 ether);
  }

  function test_strikeWithZeroNull_deliversFullLlnu() public {
    _mint(walletA, 5);
    _activateStrikes();

    vm.prank(walletA);
    llnuToken.transfer(walletB, 500 ether);

    assertEq(nullToken.balanceOf(walletB), 0);
    assertEq(llnuToken.balanceOf(walletB), 500 ether);
  }

  function test_oddStrikeAmount_bountyRounding() public {
    _mint(walletB, 1);
    _mint(walletA, 5);
    _activateStrikes();

    uint256 strikeAmount = 101 ether;
    uint256 expectedStrike = strikeAmount < nullToken.balanceOf(walletB) ? strikeAmount : nullToken.balanceOf(walletB);
    uint256 expectedDead = expectedStrike / 2;
    uint256 expectedBounty = expectedStrike - expectedDead;

    vm.prank(walletA);
    llnuToken.transfer(walletB, strikeAmount);

    assertEq(expectedDead + expectedBounty, expectedStrike);
    assertEq(nullToken.balanceOf(walletA), 5 * nullMint.TOKENS_PER_SHARE() + expectedBounty);
  }
}
