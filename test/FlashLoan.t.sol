// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {MockFlashLender, IFlashBorrower} from "./mocks/MockFlashLender.sol";
import {FlashLoanAttacker} from "./mocks/FlashLoanAttacker.sol";

/// @dev Flash-loan style attacks (local mock lender, not Aave/dYdX mainnet).
contract FlashLoanTest is ProtocolTestBase, IFlashBorrower {
  MockFlashLender lender;
  FlashLoanAttacker attacker;

  function setUp() public {
    _deployProtocol();
    lender = new MockFlashLender();
    vm.deal(address(lender), 10 ether);
    attacker = new FlashLoanAttacker(nullMint, nullToken, llnuToken);
  }

  function test_flashLoan_cannotBypassMintCap() public {
    _mint(walletB, 3);
    vm.deal(address(attacker), 0.1 ether);

    attacker.attack(lender, walletB, 0.1 ether);

    assertEq(nullMint.ethSpent(address(attacker)), nullMint.MAX_ETH_PER_ADDRESS());
    assertFalse(attacker.secondMintSucceeded());
  }

  /// @dev Contract-held $llnu cannot P2P strike victims (EOA-only transfer policy).
  function test_flashLoan_contractCannotStrikeViaLlnu() public {
    _mint(walletB, 5);
    vm.deal(address(attacker), 0.1 ether);
    uint256 nullBefore = nullToken.balanceOf(walletB);

    attacker.attack(lender, walletB, 0.1 ether);

    assertEq(nullToken.balanceOf(walletB), nullBefore);
    assertGt(llnuToken.balanceOf(address(attacker)), 0);
  }

  function test_flashLoan_mustRepay() public {
    vm.expectRevert("Not repaid");
    lender.flashLoanEth(address(this), 1 ether, "");
  }

  function onFlashLoan(uint256, bytes calldata) external pure {
    // Deliberately do not repay.
  }

  receive() external payable {}
}
