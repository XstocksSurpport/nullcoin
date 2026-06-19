// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";

/// @notice Post-deploy Etherscan verification helper (mainnet v2).
/// Run:
///   set ETHERSCAN_API_KEY=...
///   forge script script/VerifyMainnet.s.sol --chain mainnet --ffi
contract VerifyMainnet is Script {
  address internal constant NULL_MINT = 0xc27E4564dC31e9d435CEeedf77cb7B5258C49F6F;
  address internal constant HOOK = 0x3c5A6c1cc1977bdfDa02E87d0CC7C45A69302aa0;
  address internal constant NULL_TOKEN = 0xE1Ef5457eD3775DE642aB039685fA28b01ad5CD9;
  address internal constant LLNU_TOKEN = 0xBBF966A45eBd71B9515099009b842E5B3c5A9C67;
  address internal constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;
  address internal constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
  bytes32 internal constant HOOK_SALT = 0x0000000000000000000000000000000000000000000000000000000000001c53;

  function run() external {
    console2.log("NullMint (skip verify — contains admin withdrawEth):", NULL_MINT);
    console2.log("Verify these on Etherscan:");
    console2.log("  NullProtocolHook:", HOOK);
    console2.log("  NullToken:", NULL_TOKEN);
    console2.log("  LlnuToken:", LLNU_TOKEN);
    console2.log("PoolManager:", POOL_MANAGER);
    console2.log("Hook CREATE2 salt:", vm.toString(HOOK_SALT));
    console2.log("CREATE2 deployer:", CREATE2_DEPLOYER);
  }
}
