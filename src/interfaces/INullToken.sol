// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface INullToken {
  function executeStrike(address victim, address striker, uint256 amount) external;
}
