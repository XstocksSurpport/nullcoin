// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {MockDexPool} from "./mocks/MockDexPool.sol";

/// Adversarial paths: protection bypass, pre-launch strike, admin grief, auth.
contract SecurityAdversarialTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_bypass_protectionWithoutCard_stillStrikes() public {
    _mint(walletB, 5);
    _mint(walletA, 5);
    _activateStrikes();
    assertFalse(hook.isProtected(walletB));

    uint256 before = nullToken.balanceOf(walletB);
    vm.prank(walletA);
    llnuToken.transfer(walletB, 10_000 ether);
    assertLt(nullToken.balanceOf(walletB), before);
  }

  function test_bypass_expiredCard_strikesAgain() public {
    _mint(walletB, 10);
    _mint(walletA, 10);
    _activateStrikes();

    vm.startPrank(walletB);
    nullToken.approve(address(hook), hook.CARD_MONTH_NULL());
    hook.buyProtection(0);
    vm.stopPrank();
    assertTrue(hook.isProtected(walletB));

    vm.warp(block.timestamp + 31 days);
    assertFalse(hook.isProtected(walletB));

    uint256 before = nullToken.balanceOf(walletB);
    vm.prank(walletA);
    llnuToken.transfer(walletB, 5000 ether);
    assertLt(nullToken.balanceOf(walletB), before);
  }

  function test_bypass_cardBlocksButLlnuStillReceived() public {
    _mint(walletB, 10);
    _mint(walletA, 10);
    _activateStrikes();

    vm.startPrank(walletB);
    nullToken.approve(address(hook), hook.CARD_MONTH_NULL());
    hook.buyProtection(0);
    vm.stopPrank();

    uint256 llnuBefore = llnuToken.balanceOf(walletB);
    vm.prank(walletA);
    llnuToken.transfer(walletB, 777 ether);
    assertEq(nullToken.balanceOf(walletB), 10 * nullMint.TOKENS_PER_SHARE() - hook.CARD_MONTH_NULL());
    assertEq(llnuToken.balanceOf(walletB), llnuBefore + 777 ether);
  }

  function test_bypass_preSeedStrike_doesNothing() public {
    _mint(walletA, 5);
    _mint(walletB, 5);
    assertFalse(hook.liquiditySeeded());

    uint256 nullBefore = nullToken.balanceOf(walletB);
    vm.prank(walletA);
    llnuToken.transfer(walletB, 50_000 ether);
    assertEq(nullToken.balanceOf(walletB), nullBefore);
    assertEq(llnuToken.balanceOf(walletB), _llnuForShares(5) + 50_000 ether);
  }

  function test_bypass_nullTransfer_neverTriggersStrike() public {
    _mint(walletA, 10);
    _mint(walletB, 5);
    _activateStrikes();

    vm.prank(walletA);
    nullToken.transfer(walletB, 100_000 ether);
    assertEq(llnuToken.balanceOf(walletB), _llnuForShares(5));
  }

  function test_bypass_fakeHookCall_reverts() public {
    _mint(walletB, 1);
    vm.prank(walletA);
    vm.expectRevert("Only llnu");
    hook.processLlnuStrike(walletA, walletB, 1 ether);
  }

  function test_bypass_directExecuteStrike_reverts() public {
    _mint(walletB, 1);
    vm.prank(walletA);
    vm.expectRevert("Only hook");
    nullToken.executeStrike(walletB, walletA, 1 ether);
  }

  function test_bypass_llnuViaContract_reverts() public {
    _mint(walletA, 5);
    MockDexPool pool = new MockDexPool();
    vm.prank(walletA);
    vm.expectRevert("P2P only");
    llnuToken.transfer(address(pool), 1 ether);
  }

  function test_admin_withdrawEth_stealsEarlyProceeds() public {
    _mint(walletA, 10);
    uint256 fees = address(nullMint).balance;
    assertGt(fees, 0);

    vm.prank(ADMIN);
    nullMint.withdrawEth(payable(ADMIN));
    assertEq(address(nullMint).balance, 0);
    // Later minters can still fill cap with fresh ETH; seed uses that balance at cap.
  }

  function test_admin_endMintEarly_stopsFurtherMint() public {
    _mint(walletA, 5);
    vm.prank(ADMIN);
    nullMint.endMint();
    assertTrue(nullMint.mintEnded());

    uint256 price = nullMint.MINT_PRICE_ETH();
    vm.deal(walletB, price);
    vm.prank(walletB);
    vm.expectRevert("Mint ended");
    nullMint.mint{value: price}(1);
  }

  function test_strike_cannotExceedVictimNull() public {
    _mint(walletB, 1);
    _mint(walletA, 10);
    _activateStrikes();

    uint256 victimNull = nullToken.balanceOf(walletB);
    uint256 llnuBefore = llnuToken.balanceOf(walletB);
    uint256 overflow = 50_000 ether;
    vm.prank(walletA);
    llnuToken.transfer(walletB, victimNull + overflow);

    assertEq(nullToken.balanceOf(walletB), 0);
    // Strike capped at victimNull (25k); only that much llnu burned, not the full transfer.
    assertEq(llnuToken.balanceOf(walletB), llnuBefore + victimNull + overflow - victimNull);
  }

  function test_strike_bountyGoesToStrikerNotVictim() public {
    _mint(walletB, 2);
    _mint(walletA, 2);
    _activateStrikes();

    uint256 strikeAmt = 1000 ether;
    uint256 strikerNullBefore = nullToken.balanceOf(walletA);

    vm.prank(walletA);
    llnuToken.transfer(walletB, strikeAmt);

    assertGt(nullToken.balanceOf(walletA), strikerNullBefore);
    assertEq(nullToken.balanceOf(walletA), strikerNullBefore + strikeAmt / 2);
  }

  function test_cardRenewal_stacksExpiry() public {
    _mint(walletA, 20);
    vm.startPrank(walletA);
    nullToken.approve(address(hook), hook.CARD_MONTH_NULL() * 2);
    hook.buyProtection(0);
    uint256 e1 = hook.protectionExpiry(walletA);
    hook.buyProtection(0);
    uint256 e2 = hook.protectionExpiry(walletA);
    vm.stopPrank();
    assertEq(e2, e1 + 30 days);
  }
}
