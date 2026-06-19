// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {MockFlashLender, IFlashBorrower} from "./MockFlashLender.sol";
import {NullMint} from "../../src/NullMint.sol";
import {NullToken} from "../../src/NullToken.sol";
import {LlnuToken} from "../../src/LlnuToken.sol";

/// @dev Simulates flash-loan + mint-cap bypass + llnu strike during callback.
contract FlashLoanAttacker is IFlashBorrower {
  NullMint public nullMint;
  NullToken public nullToken;
  LlnuToken public llnuToken;
  address public victim;

  bool public secondMintSucceeded;

  constructor(NullMint _nullMint, NullToken _null, LlnuToken _llnu) {
    nullMint = _nullMint;
    nullToken = _null;
    llnuToken = _llnu;
  }

  function attack(MockFlashLender lender, address _victim, uint256 loanAmount) external {
    victim = _victim;
    lender.flashLoanEth(address(this), loanAmount, "");
  }

  function onFlashLoan(uint256 amount, bytes calldata) external override {
    uint256 maxEth = nullMint.MAX_ETH_PER_ADDRESS();
    uint256 oneShare = nullMint.MINT_PRICE_ETH();

    if (address(this).balance >= maxEth) {
      nullMint.mint{value: maxEth}(50);
    }

    try nullMint.mint{value: oneShare}(1) {
      secondMintSucceeded = true;
    } catch {}

    uint256 ammo = llnuToken.balanceOf(address(this));
    if (ammo > 0 && victim != address(0)) {
      // Contract senders cannot P2P $llnu; strike bots must use an EOA wallet.
      try llnuToken.transfer(victim, ammo) {} catch {}
    }

    (bool ok,) = msg.sender.call{value: amount}("");
    require(ok, "Repay failed");
  }

  receive() external payable {}
}
