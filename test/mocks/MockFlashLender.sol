// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IFlashBorrower {
  function onFlashLoan(uint256 amount, bytes calldata data) external;
}

/// @dev Minimal ETH flash-lender for attack simulations (not Aave/dYdX).
contract MockFlashLender {
  event FlashLoan(address indexed borrower, uint256 amount);

  function flashLoanEth(address borrower, uint256 amount, bytes calldata data) external {
    uint256 before = address(this).balance;
    require(before >= amount, "Liquidity");

    (bool sent,) = borrower.call{value: amount}("");
    require(sent, "Send failed");

    IFlashBorrower(borrower).onFlashLoan(amount, data);

  require(address(this).balance >= before, "Not repaid");
    emit FlashLoan(borrower, amount);
  }

  receive() external payable {}
}
