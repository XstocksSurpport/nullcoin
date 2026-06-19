// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullMint} from "../src/NullMint.sol";

/// @dev Documents admin powers and confirms they cannot pull user wallet balances.
contract AdminSecurityTest is ProtocolTestBase {
  function setUp() public {
    _deployProtocol();
  }

  function test_adminCanWithdrawMintEth() public {
    _mint(walletA, 2);
    uint256 fees = address(nullMint).balance;
    assertGt(fees, 0);

    uint256 adminBefore = ADMIN.balance;

    vm.prank(ADMIN);
    nullMint.withdrawEth(payable(ADMIN));

    assertEq(address(nullMint).balance, 0);
    assertEq(ADMIN.balance, adminBefore + fees);
    assertEq(nullToken.balanceOf(walletA), 2 * nullMint.TOKENS_PER_SHARE());
    assertEq(llnuToken.balanceOf(walletA), 2 * nullMint.TOKENS_PER_SHARE() * nullMint.LLNU_PER_NULL());
  }

  function test_adminWithdrawAfterEndMint() public {
    _mint(walletA, 3);
    uint256 fees = address(nullMint).balance;

    vm.prank(ADMIN);
    nullMint.endMint();

    uint256 adminBefore = ADMIN.balance;
    vm.prank(ADMIN);
    nullMint.withdrawEth(payable(ADMIN));

    assertEq(address(nullMint).balance, 0);
    assertEq(ADMIN.balance, adminBefore + fees);
  }

  function test_nonAdminCannotWithdraw() public {
    _mint(walletA, 1);
    vm.prank(walletA);
    vm.expectRevert("Not admin");
    nullMint.withdrawEth(payable(walletA));
  }

  function test_adminCannotMintForFree() public {
    vm.prank(ADMIN);
    vm.expectRevert("Not minter");
    nullToken.mint(ADMIN, 1 ether);
  }

  function test_adminCannotBurnUserBalancesDirectly() public {
    _mint(walletB, 1);
    vm.prank(ADMIN);
    vm.expectRevert("Only hook");
    nullToken.executeStrike(walletB, walletA, 1 ether);
  }

  function test_adminCanEndMint() public {
    vm.prank(ADMIN);
    nullMint.endMint();
    assertTrue(nullMint.mintEnded());
  }
}
