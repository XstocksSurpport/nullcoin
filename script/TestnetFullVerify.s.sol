// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {NullMint} from "../src/NullMint.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {NullToken} from "../src/NullToken.sol";
import {LlnuToken} from "../src/LlnuToken.sol";

/// @notice Post-deploy Sepolia v2 verification: mint, cap seed, strike, shield.
contract TestnetFullVerify is Script {
  address internal constant BURN = 0x000000000000000000000000000000000000dEaD;

  function run() external {
    NullMint nullMint = NullMint(payable(vm.envAddress("NULL_MINT")));
    NullProtocolHook hook = NullProtocolHook(vm.envAddress("PROTOCOL_HOOK"));
    NullToken nullToken = NullToken(vm.envAddress("NULL_TOKEN"));
    LlnuToken llnuToken = LlnuToken(vm.envAddress("LLNU_TOKEN"));

    uint256 funderKey = vm.envUint("PRIVATE_KEY");
    uint256 keyA = vm.envOr("WALLET_A_KEY", funderKey);
    uint256 keyB = vm.envOr("WALLET_B_KEY", uint256(keccak256("null-testnet-wallet-b")));
    address walletA = vm.addr(keyA);
    address walletB = vm.addr(keyB);

    _fundIfNeeded(funderKey, walletB, 0.15 ether);

    _logWiring(nullMint, hook, nullToken, llnuToken);
    _logV2Constants(nullMint, hook);

    _mintWallet(nullMint, keyA, 5);
    _mintWallet(nullMint, keyB, 3);
    _assertMintBalances(nullMint, nullToken, llnuToken, walletA, 5);
    _assertMintBalances(nullMint, nullToken, llnuToken, walletB, 3);

    _preSeedStrikeInactive(keyA, keyB, hook, nullToken, llnuToken);

    if (vm.envOr("SKIP_CAP_FILL", false)) {
      console2.log("SKIP_CAP_FILL set - skipping cap fill, LP seed, and post-seed strike");
      _buyCardAndBlockStrike(keyB, keyA, hook, nullToken, llnuToken);
      console2.log("=== LITE V2 CHECKS PASSED (no LP/strike) ===");
      return;
    }

    _fillMintCap(nullMint, funderKey);
    require(nullMint.liquiditySeeded(), "LP not seeded");
    require(hook.liquiditySeeded(), "hook not seeded");
    console2.log("liquidity seeded OK");

    _strikeV2(keyA, keyB, hook, llnuToken, nullToken, 10_000 ether);
    _buyCardAndBlockStrike(keyB, keyA, hook, nullToken, llnuToken);

    console2.log("=== ALL V2 CHECKS PASSED ===");
  }

  function _fundIfNeeded(uint256 funderKey, address to, uint256 minBalance) internal {
    if (to.balance >= minBalance) return;
    vm.startBroadcast(funderKey);
    (bool ok,) = payable(to).call{value: minBalance}("");
    require(ok, "fund failed");
    vm.stopBroadcast();
    console2.log("funded", to, minBalance);
  }

  function _logWiring(
    NullMint nullMint,
    NullProtocolHook hook,
    NullToken nullToken,
    LlnuToken llnuToken
  ) internal view {
    console2.log("=== wiring ===");
    console2.log("nullMint.hook", nullMint.hook());
    console2.log("hook.nullToken", hook.nullToken());
    console2.log("hook.nullMint", hook.nullMint());
    console2.log("nullToken.hook", nullToken.hook());
    console2.log("llnuToken.hook", llnuToken.hook());
    require(nullMint.configured(), "NullMint not configured");
    require(nullMint.hook() == address(hook), "hook wiring");
    require(hook.nullToken() == address(nullToken), "null wiring");
    require(hook.llnuToken() == address(llnuToken), "llnu wiring");
  }

  function _logV2Constants(NullMint nullMint, NullProtocolHook hook) internal view {
    console2.log("=== v2 constants ===");
    console2.log("TOKENS_PER_SHARE", nullMint.TOKENS_PER_SHARE());
    console2.log("LLNU_PER_NULL", nullMint.LLNU_PER_NULL());
    console2.log("CARD_MONTH", hook.CARD_MONTH_NULL());
    require(nullMint.TOKENS_PER_SHARE() == 25_000 ether, "share mismatch");
    require(nullMint.LLNU_PER_NULL() == 2, "llnu ratio mismatch");
    require(hook.CARD_MONTH_NULL() == 60_000 ether, "month card mismatch");
    require(hook.CARD_QUARTER_NULL() == 160_000 ether, "quarter card mismatch");
    require(hook.CARD_YEAR_NULL() == 460_000 ether, "year card mismatch");
  }

  function _mintWallet(NullMint nullMint, uint256 key, uint256 shares) internal {
    uint256 cost = nullMint.MINT_PRICE_ETH() * shares;
    vm.startBroadcast(key);
    nullMint.mint{value: cost}(shares);
    vm.stopBroadcast();
    console2.log("minted shares", shares);
  }

  function _assertMintBalances(
    NullMint nullMint,
    NullToken nullToken,
    LlnuToken llnuToken,
    address user,
    uint256 shares
  ) internal view {
    uint256 perShare = nullMint.TOKENS_PER_SHARE();
    require(nullToken.balanceOf(user) == perShare * shares, "null mint balance");
    require(llnuToken.balanceOf(user) == perShare * shares * nullMint.LLNU_PER_NULL(), "llnu mint balance");
  }

  function _preSeedStrikeInactive(
    uint256 strikerKey,
    uint256 victimKey,
    NullProtocolHook hook,
    NullToken nullToken,
    LlnuToken llnuToken
  ) internal {
    require(!hook.liquiditySeeded(), "already seeded");
    address victim = vm.addr(victimKey);
    uint256 nullBefore = nullToken.balanceOf(victim);

    vm.startBroadcast(strikerKey);
    llnuToken.transfer(victim, 1000 ether);
    vm.stopBroadcast();

    require(nullToken.balanceOf(victim) == nullBefore, "pre-seed strike fired");
    console2.log("pre-seed strike inactive OK");
  }

  function _fillMintCap(NullMint nullMint, uint256 funderKey) internal {
    uint256 target = nullMint.MINT_TARGET_ETH();
    uint256 price = nullMint.MINT_PRICE_ETH();
    uint256 maxEth = nullMint.MAX_ETH_PER_ADDRESS();
    uint256 i = 0;

    while (nullMint.totalEthRaised() < target) {
      uint256 userKey = uint256(keccak256(abi.encodePacked("null-sepolia-filler", i++)));
      address user = vm.addr(userKey);
      uint256 remaining = target - nullMint.totalEthRaised();
      uint256 ethCost = remaining > maxEth ? maxEth : remaining;
      uint256 shares = ethCost / price;
      require(shares > 0, "cannot fill");

      if (user.balance < ethCost) {
        vm.startBroadcast(funderKey);
        (bool ok,) = payable(user).call{value: ethCost + 0.002 ether}("");
        require(ok, "filler fund failed");
        vm.stopBroadcast();
      }

      vm.startBroadcast(userKey);
      nullMint.mint{value: ethCost}(shares);
      vm.stopBroadcast();
    }

    require(nullMint.totalEthRaised() == target, "cap not reached");
    console2.log("mint cap filled", target);
  }

  function _strikeV2(
    uint256 strikerKey,
    uint256 victimKey,
    NullProtocolHook hook,
    LlnuToken llnuToken,
    NullToken nullToken,
    uint256 amount
  ) internal {
    require(hook.liquiditySeeded(), "strike needs seed");
    address striker = vm.addr(strikerKey);
    address victim = vm.addr(victimKey);

    uint256 victimNullBefore = nullToken.balanceOf(victim);
    uint256 strikerNullBefore = nullToken.balanceOf(striker);
    uint256 victimLlnuBefore = llnuToken.balanceOf(victim);
    uint256 deadBefore = nullToken.balanceOf(BURN);

    vm.startBroadcast(strikerKey);
    llnuToken.transfer(victim, amount);
    vm.stopBroadcast();

    uint256 strike = amount < victimNullBefore ? amount : victimNullBefore;
    uint256 toDead = strike / 2;
    uint256 bounty = strike - toDead;

    require(nullToken.balanceOf(victim) == victimNullBefore - strike, "victim null");
    require(nullToken.balanceOf(striker) == strikerNullBefore + bounty, "striker bounty");
    require(nullToken.balanceOf(BURN) == deadBefore + toDead, "dead null");
    require(llnuToken.balanceOf(victim) == victimLlnuBefore + amount - strike, "victim llnu");
    console2.log("v2 strike OK", strike);
  }

  function _buyCardAndBlockStrike(
    uint256 buyerKey,
    uint256 strikerKey,
    NullProtocolHook hook,
    NullToken nullToken,
    LlnuToken llnuToken
  ) internal {
    address buyer = vm.addr(buyerKey);
    uint256 cardCost = hook.CARD_MONTH_NULL();
    uint256 burnBefore = nullToken.balanceOf(BURN);

    vm.startBroadcast(buyerKey);
    nullToken.approve(address(hook), cardCost);
    hook.buyProtection(0);
    vm.stopBroadcast();

    require(hook.isProtected(buyer), "not protected");
    require(nullToken.balanceOf(BURN) == burnBefore + cardCost, "card burn mismatch");
    console2.log("month card purchased, burned", cardCost);

    uint256 nullBefore = nullToken.balanceOf(buyer);
    uint256 llnuBefore = llnuToken.balanceOf(buyer);

    vm.startBroadcast(strikerKey);
    llnuToken.transfer(buyer, 50_000 ether);
    vm.stopBroadcast();

    require(nullToken.balanceOf(buyer) == nullBefore, "protected null burned");
    require(llnuToken.balanceOf(buyer) == llnuBefore + 50_000 ether, "llnu not received");
    console2.log("protection blocked strike OK");
  }
}
