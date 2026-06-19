// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {NullMint} from "../src/NullMint.sol";
import {NullToken} from "../src/NullToken.sol";
import {LlnuToken} from "../src/LlnuToken.sol";

/// @notice Post-deploy live testnet interactions. Set env vars from deployment output.
contract TestnetE2E is Script {
  function run() external {
    address nullMint = vm.envAddress("NULL_MINT");
    address nullToken = vm.envAddress("NULL_TOKEN");
    address llnuToken = vm.envAddress("LLNU_TOKEN");

    uint256 keyA = vm.envUint("WALLET_A_KEY");
    uint256 keyB = vm.envUint("WALLET_B_KEY");

    _mintAndStrike(keyA, keyB, nullMint, llnuToken, nullToken);
    _mintAndStrike(keyB, keyA, nullMint, llnuToken, nullToken);
  }

  function _mintAndStrike(
    uint256 minterKey,
    uint256 victimKey,
    address nullMint,
    address strikeToken,
    address victimToken
  ) internal {
    address victim = vm.addr(victimKey);
    NullMint mint = NullMint(payable(nullMint));
    uint256 cost = mint.MINT_PRICE_ETH() * 5;

    vm.startBroadcast(minterKey);
    mint.mint{value: cost}(5);
    vm.stopBroadcast();

    uint256 victimBefore = NullToken(victimToken).balanceOf(victim);
    console2.log("Victim null balance before:", victimBefore);

    uint256[] memory amounts = new uint256[](3);
    amounts[0] = 1 * 10 ** 18;
    amounts[1] = 10 * 10 ** 18;
    amounts[2] = 20 * 10 ** 18;

    for (uint256 i = 0; i < amounts.length; i++) {
      vm.startBroadcast(minterKey);
      LlnuToken(strikeToken).transfer(victim, amounts[i]);
      vm.stopBroadcast();

      uint256 victimAfter = NullToken(victimToken).balanceOf(victim);
      uint256 strikeBal = LlnuToken(strikeToken).balanceOf(victim);
      console2.log("Strike amount:", amounts[i]);
      console2.log("Victim null after:", victimAfter);
      console2.log("Victim llnu after:", strikeBal);
    }
  }
}
