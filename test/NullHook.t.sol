// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";

contract NullHookTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_buyProtection_month_burnsNull() public {
    _mint(walletA, 10);
    uint256 cost = hook.CARD_MONTH_NULL();
    uint256 burnBefore = nullToken.balanceOf(BURN_ADDRESS);

    vm.startPrank(walletA);
    nullToken.approve(address(hook), cost);
    hook.buyProtection(0);
    vm.stopPrank();

    assertTrue(hook.isProtected(walletA));
    assertEq(nullToken.balanceOf(BURN_ADDRESS), burnBefore + cost);
  }

  function test_buyProtection_year_cost() public view {
    assertEq(hook.CARD_YEAR_NULL(), 460_000 ether);
  }

  function test_buyProtection_quarter_cost() public view {
    assertEq(hook.CARD_QUARTER_NULL(), 160_000 ether);
  }

  function test_buyProtection_renewExtendsExpiry() public {
    _mint(walletA, 30);
    uint256 cost = hook.CARD_MONTH_NULL();

    vm.startPrank(walletA);
    nullToken.approve(address(hook), cost * 2);
    hook.buyProtection(0);
    uint256 expiry1 = hook.protectionExpiry(walletA);
    vm.warp(block.timestamp + 10 days);
    hook.buyProtection(0);
    uint256 expiry2 = hook.protectionExpiry(walletA);
    vm.stopPrank();

    assertGt(expiry2, expiry1);
    assertEq(expiry2, expiry1 + 30 days);
  }

  function test_buyProtection_invalidType_reverts() public {
    _mint(walletA, 10);
    vm.prank(walletA);
    vm.expectRevert("Invalid type");
    hook.buyProtection(3);
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

    assertTrue(hook.isProtected(walletB));
    uint256 nullBefore = nullToken.balanceOf(walletB);
    uint256 llnuBefore = llnuToken.balanceOf(walletB);

    vm.prank(walletA);
    llnuToken.transfer(walletB, 100_000 ether);

    assertEq(nullToken.balanceOf(walletB), nullBefore);
    assertEq(llnuToken.balanceOf(walletB), llnuBefore + 100_000 ether);
  }

  function test_recoverMisdirectedTokens() public {
    _mint(walletA, 5);
    uint256 misdirected = 5_000 ether;

    vm.prank(walletA);
    nullToken.transfer(address(hook), misdirected);

    assertEq(nullToken.balanceOf(address(hook)), misdirected);

    hook.recoverMisdirectedTokens(address(nullToken), walletB);

    assertEq(nullToken.balanceOf(address(hook)), 0);
    assertEq(nullToken.balanceOf(walletB), misdirected);
  }
}
