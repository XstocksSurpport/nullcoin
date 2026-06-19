// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {NullMint} from "../src/NullMint.sol";
import {NullToken} from "../src/NullToken.sol";
import {LlnuToken} from "../src/LlnuToken.sol";
import {HookMiner} from "./HookMiner.sol";

abstract contract ProtocolTestBase is Test {
  NullProtocolHook hook;
  NullMint nullMint;
  NullToken nullToken;
  LlnuToken llnuToken;
  PoolManager manager;

  address internal constant ADMIN = 0xeB9c027FA55cEe6D722177f06441B451961731FC;
  address internal constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  address poolManager;
  address walletA = makeAddr("walletA");
  address walletB = makeAddr("walletB");

  function _hookFlags() internal pure returns (uint160) {
    return uint160(
      Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        | Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_DONATE_FLAG
    );
  }

  function _deployMinedHook(IPoolManager pm) internal returns (NullProtocolHook) {
    bytes memory ctorArgs = abi.encode(pm, address(this));
    (address expected, bytes32 salt) =
      HookMiner.find(address(this), _hookFlags(), type(NullProtocolHook).creationCode, ctorArgs);
    NullProtocolHook deployed = new NullProtocolHook{salt: salt}(pm, address(this));
    require(address(deployed) == expected, "Hook mine mismatch");
    return deployed;
  }

  function _deployProtocol() internal {
    manager = new PoolManager(address(this));
    poolManager = address(manager);

    nullMint = new NullMint();
    hook = _deployMinedHook(IPoolManager(poolManager));
    nullToken = new NullToken("Null", "null", address(hook));
    llnuToken = new LlnuToken("Llnu", "llnu", address(hook));

    nullToken.setLlnuToken(address(llnuToken));
    llnuToken.setNullToken(address(nullToken));
    nullToken.setMinter(address(nullMint));
    llnuToken.setMinter(address(nullMint));
    hook.setTokens(address(nullToken), address(llnuToken));
    hook.setNullMint(address(nullMint));
    nullMint.configure(address(hook), address(nullToken), address(llnuToken));

    vm.deal(walletA, 10 ether);
    vm.deal(walletB, 10 ether);
  }

  function _mintCost(uint256 shares) internal view returns (uint256) {
    return nullMint.MINT_PRICE_ETH() * shares;
  }

  function _mint(address user, uint256 shares) internal {
    uint256 cost = _mintCost(shares);
    vm.prank(user);
    nullMint.mint{value: cost}(shares);
  }

  function _llnuForShares(uint256 shares) internal view returns (uint256) {
    return shares * nullMint.TOKENS_PER_SHARE() * nullMint.LLNU_PER_NULL();
  }

  function _activateStrikes() internal {
    if (!hook.liquiditySeeded()) {
      _fillMintCap();
    }
  }

  function _fillMintCap() internal {
    uint256 target = nullMint.MINT_TARGET_ETH();
    uint256 price = nullMint.MINT_PRICE_ETH();
    uint256 maxEth = nullMint.MAX_ETH_PER_ADDRESS();
    uint256 i = 0;

    while (nullMint.totalEthRaised() < target) {
      address user = address(uint160(10_000 + i++));
      uint256 remaining = target - nullMint.totalEthRaised();
      uint256 ethCost = remaining > maxEth ? maxEth : remaining;
      uint256 shares = ethCost / price;
      require(shares > 0, "Cannot fill");
      vm.deal(user, ethCost);
      vm.prank(user);
      nullMint.mint{value: ethCost}(shares);
    }
  }
}
