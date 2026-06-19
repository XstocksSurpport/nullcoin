// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

interface INullProtocolHook {
  function poolManager() external view returns (IPoolManager);
  function isProtected(address user) external view returns (bool);
  function processLlnuStrike(address striker, address victim, uint256 amount) external returns (uint256 strikeAmount);
  function isHookPeaceZone(address from, address to) external view returns (bool);
  function finalizeMintAndSeedLiquidity(uint256 nullAmount) external payable;
}
