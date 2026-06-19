// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullMint} from "../src/NullMint.sol";

/// @dev Adversarial scenarios: caps, auth, reentrancy-style paths, drain attempts.
contract AttackTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_attack_unauthorizedMint() public {
    vm.prank(walletA);
    vm.expectRevert("Not minter");
    nullToken.mint(walletA, 1 ether);
  }

  function test_attack_mintBeyondCap() public {
    _fillMintCap();
    assertEq(nullMint.totalEthRaised(), nullMint.MINT_TARGET_ETH());

    uint256 price = nullMint.MINT_PRICE_ETH();
    vm.deal(walletB, price);
    vm.prank(walletB);
    vm.expectRevert("Mint ended");
    nullMint.mint{value: price}(1);
  }

  function test_attack_fakeStrikeBurn() public {
    _mint(walletB, 1);
    vm.prank(walletA);
    vm.expectRevert("Only hook");
    nullToken.executeStrike(walletB, walletA, 1 ether);
  }

  function test_attack_cardPaymentBurnsNotWithdrawable() public {
    _mint(walletA, 10);
    uint256 cost = hook.CARD_MONTH_NULL();

    vm.startPrank(walletA);
    nullToken.approve(address(hook), cost);
    hook.buyProtection(0);
    vm.stopPrank();

    assertEq(nullToken.balanceOf(BURN_ADDRESS), cost);
    assertEq(nullToken.balanceOf(address(hook)), 0);
  }

  function test_attack_reentrancy_strikeCompletes() public {
    _mint(walletB, 5);
    _mint(walletA, 5);
    _activateStrikes();
    uint256 nullBefore = nullToken.balanceOf(walletB);
    uint256 llnuBefore = llnuToken.balanceOf(walletB);

    vm.prank(walletA);
    llnuToken.transfer(walletB, 50_000 * 10 ** 18);

    assertLt(nullToken.balanceOf(walletB), nullBefore);
    assertEq(llnuToken.balanceOf(walletB), llnuBefore);
  }

  function test_attack_doubleConfigureMint() public {
    vm.expectRevert("Already configured");
    nullMint.configure(address(hook), address(nullToken), address(llnuToken));
  }

  function test_attack_transferDoesNotBypassMintCap() public {
    uint256 maxEth = nullMint.MAX_ETH_PER_ADDRESS();
    uint256 oneShare = nullMint.MINT_PRICE_ETH();
    vm.startPrank(walletA);
    nullMint.mint{value: maxEth}(50);
    vm.expectRevert("Address cap");
    nullMint.mint{value: oneShare}(1);
    vm.stopPrank();
  }

  function test_attack_llnuDexBlocked() public {
    _mint(walletA, 1);
    vm.prank(walletA);
    vm.expectRevert("No liquidity");
    llnuToken.transfer(poolManager, 1 ether);
  }
}
