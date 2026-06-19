// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullMint} from "../src/NullMint.sol";

contract FuzzTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function testFuzz_mintRespectsCap(uint8 shares) public {
    shares = uint8(bound(shares, 1, 50));
    uint256 cost = nullMint.MINT_PRICE_ETH() * shares;
    vm.deal(walletA, cost);
    vm.prank(walletA);
    nullMint.mint{value: cost}(shares);
    uint256 amount = uint256(shares) * nullMint.TOKENS_PER_SHARE();
    assertEq(nullMint.ethSpent(walletA), cost);
    assertEq(nullToken.balanceOf(walletA), amount);
    assertEq(llnuToken.balanceOf(walletA), amount * nullMint.LLNU_PER_NULL());
  }

  function testFuzz_mintOverCapReverts(uint8 first, uint8 second) public {
    first = uint8(bound(first, 1, 50));
    second = uint8(bound(second, 1, 50));
    if (uint256(first) + uint256(second) <= 50) return;

    uint256 firstCost = nullMint.MINT_PRICE_ETH() * first;
    uint256 secondCost = nullMint.MINT_PRICE_ETH() * second;
    vm.deal(walletA, firstCost + secondCost);
    vm.startPrank(walletA);
    nullMint.mint{value: firstCost}(first);
    vm.expectRevert("Address cap");
    nullMint.mint{value: secondCost}(second);
    vm.stopPrank();
  }

  function testFuzz_strikeBurnsEqualTokens(uint96 strikeTokens) public {
    _mint(walletB, 10);
    _mint(walletA, 10);
    _activateStrikes();
    uint256 maxStrike = llnuToken.balanceOf(walletA);
    strikeTokens = uint96(bound(strikeTokens, 1, maxStrike));

    uint256 victimNullBefore = nullToken.balanceOf(walletB);
    uint256 victimLlnuBefore = llnuToken.balanceOf(walletB);

    vm.prank(walletA);
    llnuToken.transfer(walletB, strikeTokens);

    uint256 nullBurned = victimNullBefore - nullToken.balanceOf(walletB);
    uint256 llnuNet = llnuToken.balanceOf(walletB) - victimLlnuBefore;

    if (nullBurned == 0) {
      assertEq(llnuNet, strikeTokens);
      return;
    }

    assertEq(nullBurned, strikeTokens - llnuNet);
  }
}
