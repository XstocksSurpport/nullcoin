// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";

/// @dev DEX neutral-zone flows: $null tradeable, $llnu has no pool liquidity.
contract DexExemptionTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_sellNullToPool_noStrike() public {
    _mint(walletA, 5);
    _mint(walletB, 5);

    vm.prank(walletA);
    nullToken.transfer(poolManager, 1000 ether);

    assertEq(nullToken.balanceOf(poolManager), 1000 ether);
    assertEq(nullToken.balanceOf(walletB), 5 * nullMint.TOKENS_PER_SHARE());
  }

  function test_buyNullFromPool_noStrike() public {
    _mint(walletB, 5);
    _mint(walletA, 5);

    vm.prank(walletA);
    nullToken.transfer(poolManager, 500 ether);

    vm.prank(poolManager);
    nullToken.transfer(walletB, 500 ether);

    assertEq(nullToken.balanceOf(walletB), 5 * nullMint.TOKENS_PER_SHARE() + 500 ether);
  }

  function test_llnuPoolTransfer_reverts() public {
    _mint(walletA, 5);

    vm.prank(walletA);
    vm.expectRevert("No liquidity");
    llnuToken.transfer(poolManager, 500 ether);
  }

  function test_p2pStrike_afterNullPoolFlow() public {
    _mint(walletB, 5);
    _mint(walletA, 5);
    _activateStrikes();

    vm.prank(walletA);
    nullToken.transfer(poolManager, 100 ether);
    vm.prank(poolManager);
    nullToken.transfer(walletB, 100 ether);

    uint256 nullBefore = nullToken.balanceOf(walletB);
    vm.prank(walletA);
    llnuToken.transfer(walletB, 50 ether);
    assertLt(nullToken.balanceOf(walletB), nullBefore);
  }
}
