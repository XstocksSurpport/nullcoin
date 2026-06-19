// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {NullMint} from "../src/NullMint.sol";
import {NullToken} from "../src/NullToken.sol";
import {LlnuToken} from "../src/LlnuToken.sol";

/// @dev Fork Sepolia v2 deployment (post TestnetFullVerify).
/// Run: forge test --match-contract SepoliaForkTest --fork-url $SEPOLIA_RPC -vv
contract SepoliaForkTest is Test {
  address internal constant NULL_MINT = payable(0x5F321782b211b7e8fEe4fB503f9Ea164c0E9c331);
  address internal constant HOOK = 0x586bc977eEe28e154d91403203543b03E8346aa0;
  address internal constant NULL_TOKEN = 0xf24Df1a9e2b970B8BDe387f6Fb20E78F3f5beb4d;
  address internal constant LLNU_TOKEN = 0x07a63d25a0383720d7a0ff2f5d446F4b90Cbc874;
  address internal constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
  address internal constant ADMIN = 0xeB9c027FA55cEe6D722177f06441B451961731FC;
  address internal constant BURN = 0x000000000000000000000000000000000000dEaD;

  NullMint nullMint;
  NullProtocolHook hook;
  NullToken nullToken;
  LlnuToken llnuToken;

  address walletA = makeAddr("sepoliaA");
  address walletB = makeAddr("sepoliaB");

  function setUp() public {
    vm.createSelectFork(vm.envOr("SEPOLIA_RPC_URL", string("https://ethereum-sepolia-rpc.publicnode.com")));

    nullMint = NullMint(payable(NULL_MINT));
    hook = NullProtocolHook(HOOK);
    nullToken = NullToken(NULL_TOKEN);
    llnuToken = LlnuToken(LLNU_TOKEN);
  }

  function _seedWallets(uint256 nullAmt, uint256 llnuAmt) internal {
    deal(address(nullToken), walletA, nullAmt);
    deal(address(llnuToken), walletA, llnuAmt);
    deal(address(nullToken), walletB, nullAmt);
    deal(address(llnuToken), walletB, llnuAmt);
  }

  function test_sepolia_deploymentWiring() public view {
    assertEq(nullMint.hook(), HOOK);
    assertEq(address(nullMint.nullToken()), NULL_TOKEN);
    assertEq(address(nullMint.llnuToken()), LLNU_TOKEN);
    assertTrue(nullMint.configured());

    assertEq(hook.nullToken(), NULL_TOKEN);
    assertEq(hook.llnuToken(), LLNU_TOKEN);
    assertEq(hook.nullMint(), NULL_MINT);
    assertEq(address(hook.poolManager()), POOL_MANAGER);

    assertEq(nullToken.hook(), HOOK);
    assertEq(nullToken.llnuToken(), LLNU_TOKEN);
    assertEq(nullToken.minter(), NULL_MINT);

    assertEq(llnuToken.hook(), HOOK);
    assertEq(llnuToken.nullToken(), NULL_TOKEN);
    assertEq(llnuToken.minter(), NULL_MINT);
  }

  function test_sepolia_mintConstants() public view {
    assertEq(nullMint.MINT_PRICE_ETH(), 0.002 ether);
    assertEq(nullMint.MAX_ETH_PER_ADDRESS(), 0.1 ether);
    assertEq(nullMint.MINT_TARGET_ETH(), 4 ether);
    assertEq(nullMint.TOKENS_PER_SHARE(), 25_000 * 10 ** 18);
    assertEq(nullMint.LLNU_PER_NULL(), 2);
    assertEq(nullMint.ADMIN(), ADMIN);
  }

  function test_sepolia_capFilledAndSeeded() public view {
    assertTrue(nullMint.mintEnded());
    assertTrue(nullMint.liquiditySeeded());
    assertTrue(hook.liquiditySeeded());
    assertEq(nullMint.totalEthRaised(), 4 ether);
  }

  function test_sepolia_hookAddressHasV4Permissions() public view {
    uint160 flags = uint160(
      Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        | Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_DONATE_FLAG
    );
    assertTrue(Hooks.hasPermission(IHooks(HOOK), flags));
  }

  function test_sepolia_v2StrikeMechanism() public {
    _seedWallets(200_000 ether, 400_000 ether);

    uint256 victimNull = nullToken.balanceOf(walletB);
    uint256 strikerNullBefore = nullToken.balanceOf(walletA);
    uint256 deadBefore = nullToken.balanceOf(BURN);
    uint256 strikeAmt = 10_000 ether;

    vm.prank(walletA);
    llnuToken.transfer(walletB, strikeAmt);

    uint256 strike = strikeAmt;
    uint256 toDead = strike / 2;
    uint256 bounty = strike - toDead;

    assertEq(nullToken.balanceOf(walletB), victimNull - strike);
    assertEq(nullToken.balanceOf(walletA), strikerNullBefore + bounty);
    assertEq(nullToken.balanceOf(BURN), deadBefore + toDead);
  }

  function test_sepolia_nullDexNeutral_llnuPoolBlocked() public {
    _seedWallets(1000 ether, 1000 ether);

    uint256 pmNullBefore = nullToken.balanceOf(POOL_MANAGER);
    vm.prank(walletA);
    nullToken.transfer(POOL_MANAGER, 1000 ether);
    assertEq(nullToken.balanceOf(POOL_MANAGER), pmNullBefore + 1000 ether);

    vm.prank(walletA);
    vm.expectRevert("No liquidity");
    llnuToken.transfer(POOL_MANAGER, 1 ether);
  }

  function test_sepolia_cardConstants() public view {
    assertEq(hook.CARD_MONTH_NULL(), 60_000 ether);
    assertEq(hook.CARD_QUARTER_NULL(), 160_000 ether);
    assertEq(hook.CARD_YEAR_NULL(), 460_000 ether);
  }

  function test_sepolia_cardProtection() public {
    _seedWallets(200_000 ether, 200_000 ether);

    uint256 cardCost = hook.CARD_MONTH_NULL();
    vm.startPrank(walletB);
    nullToken.approve(HOOK, cardCost);
    hook.buyProtection(0);
    vm.stopPrank();

    assertTrue(hook.isProtected(walletB));
    uint256 nullBefore = nullToken.balanceOf(walletB);
    uint256 llnuBefore = llnuToken.balanceOf(walletB);

    vm.prank(walletA);
    llnuToken.transfer(walletB, 50_000 ether);

    assertEq(nullToken.balanceOf(walletB), nullBefore);
    assertEq(llnuToken.balanceOf(walletB), llnuBefore + 50_000 ether);
  }

  function test_sepolia_adminCannotDirectExecuteStrike() public {
    _seedWallets(1000 ether, 1000 ether);

    vm.prank(ADMIN);
    vm.expectRevert("Only hook");
    nullToken.executeStrike(walletB, walletA, 1 ether);
  }
}
