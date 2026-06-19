// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtocolTestBase} from "./ProtocolTestBase.sol";
import {NullMint} from "../src/NullMint.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";

contract NullMintTest is ProtocolTestBase {
  using StateLibrary for IPoolManager;

  function setUp() public {
    _deployProtocol();
  }

  function test_mint_accounting() public {
    _mint(walletA, 5);
    uint256 amount = 5 * nullMint.TOKENS_PER_SHARE();
    assertEq(nullToken.balanceOf(walletA), amount);
    assertEq(llnuToken.balanceOf(walletA), amount * nullMint.LLNU_PER_NULL());
    assertEq(nullMint.ethSpent(walletA), _mintCost(5));
    assertEq(address(nullMint).balance, _mintCost(5));
  }

  function test_mint_bonusIsTwoLlnuPerNull() public {
    _mint(walletB, 1);
    uint256 amount = nullMint.TOKENS_PER_SHARE();
    assertEq(nullToken.balanceOf(walletB), amount);
    assertEq(llnuToken.balanceOf(walletB), amount * 2);
  }

  function test_wrongEthAmount_reverts() public {
    vm.prank(walletA);
    vm.expectRevert("Wrong ETH amount");
    nullMint.mint{value: 0.001 ether}(5);
  }

  function test_addressCap_reverts() public {
    uint256 maxEth = nullMint.MAX_ETH_PER_ADDRESS();
    uint256 oneShare = nullMint.MINT_PRICE_ETH();
    vm.startPrank(walletA);
    nullMint.mint{value: maxEth}(50);
    vm.expectRevert("Address cap");
    nullMint.mint{value: oneShare}(1);
    vm.stopPrank();
  }

  function test_ethStaysInContractUntilLiquidity() public {
    _mint(walletA, 1);
    uint256 fee = nullMint.MINT_PRICE_ETH();
    assertEq(address(nullMint).balance, fee);
    assertFalse(nullMint.liquiditySeeded());
  }

  function test_mintProgressBps() public {
    _mint(walletA, 1);
    uint256 bps = nullMint.mintProgressBps();
    assertGt(bps, 0);
    assertLt(bps, 10_000);
  }

  function test_endMint_blocksFurtherMint() public {
    vm.prank(ADMIN);
    nullMint.endMint();
    assertTrue(nullMint.mintEnded());

    uint256 price = nullMint.MINT_PRICE_ETH();
    vm.deal(walletA, price);
    vm.prank(walletA);
    vm.expectRevert("Mint ended");
    nullMint.mint{value: price}(1);
  }

  function test_receiveAfterMintEnded_reverts() public {
    vm.prank(ADMIN);
    nullMint.endMint();

    vm.deal(walletA, 1 ether);
    vm.prank(walletA);
    vm.expectRevert("Mint ended");
    (bool ok,) = address(nullMint).call{value: 1 ether}("");
    ok;
  }

  function test_adminWithdrawAllEth() public {
    _mint(walletA, 4);
    uint256 bal = address(nullMint).balance;
    uint256 adminBefore = ADMIN.balance;

    vm.prank(ADMIN);
    nullMint.withdrawEth(payable(ADMIN));

    assertEq(address(nullMint).balance, 0);
    assertEq(ADMIN.balance, adminBefore + bal);
  }

  function test_onlyAdminEndsMint() public {
    vm.prank(walletA);
    vm.expectRevert("Not admin");
    nullMint.endMint();
  }

  function test_autoSeedLiquidityAtCap() public {
    _fillMintCap();

    assertTrue(nullMint.mintEnded());
    assertTrue(nullMint.liquiditySeeded());
    assertTrue(hook.liquiditySeeded());
    assertEq(address(nullMint).balance, 0);
    assertEq(nullMint.totalEthRaised(), nullMint.MINT_TARGET_ETH());

    assertEq(nullToken.totalSupply(), 100_000_000 ether);
    assertEq(llnuToken.totalSupply(), 100_000_000 ether);

    (uint160 sqrtPrice,,,) = IPoolManager(address(manager)).getSlot0(hook.liquiditySeeder().poolKey().toId());
    assertGt(sqrtPrice, 0);
  }

  function test_mintCapReverts() public {
    _fillMintCap();

    uint256 price = nullMint.MINT_PRICE_ETH();
    vm.deal(walletB, price);
    vm.prank(walletB);
    vm.expectRevert("Mint ended");
    nullMint.mint{value: price}(1);
  }
}
