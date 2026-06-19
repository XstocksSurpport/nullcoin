// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @dev Simulates Uniswap v4 PoolManager receiving/sending tokens without annihilation.
contract MockPoolManager {
  function deposit(address token, uint256 amount) external {
    require(IERC20Like(token).transferFrom(msg.sender, address(this), amount), "xfer");
  }

  function send(address token, address to, uint256 amount) external {
    require(IERC20Like(token).transfer(to, amount), "xfer");
  }
}

interface IERC20Like {
  function transfer(address to, uint256 amount) external returns (bool);
  function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
