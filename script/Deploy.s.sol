// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {NullProtocolHook} from "../src/NullProtocolHook.sol";
import {NullMint} from "../src/NullMint.sol";
import {NullToken} from "../src/NullToken.sol";
import {LlnuToken} from "../src/LlnuToken.sol";
import {HookMiner} from "../test/HookMiner.sol";

contract Deploy is Script {
  address internal constant ADMIN = 0xeB9c027FA55cEe6D722177f06441B451961731FC;
  /// @dev Forge broadcast routes CREATE2 through this proxy; salt must be mined for it.
  address internal constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address deployer = vm.addr(deployerPrivateKey);
    address poolManager = vm.envOr("V4_POOL_MANAGER", address(0xdead));

    vm.startBroadcast(deployerPrivateKey);

    NullMint nullMint = new NullMint();

    uint160 flags = uint160(
      Hooks.BEFORE_INITIALIZE_FLAG | Hooks.BEFORE_ADD_LIQUIDITY_FLAG | Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        | Hooks.BEFORE_SWAP_FLAG | Hooks.BEFORE_DONATE_FLAG
    );
    bytes memory ctorArgs = abi.encode(IPoolManager(poolManager), deployer);
    (address expectedHook, bytes32 salt) =
      HookMiner.find(CREATE2_DEPLOYER, flags, type(NullProtocolHook).creationCode, ctorArgs);
    NullProtocolHook hook = new NullProtocolHook{salt: salt}(IPoolManager(poolManager), deployer);
    require(address(hook) == expectedHook, "Hook mine mismatch");

    NullToken nullToken = new NullToken("Null", "null", address(hook));
    LlnuToken llnuToken = new LlnuToken("Llnu", "llnu", address(hook));

    nullToken.setLlnuToken(address(llnuToken));
    llnuToken.setNullToken(address(nullToken));
    nullToken.setMinter(address(nullMint));
    llnuToken.setMinter(address(nullMint));
    hook.setTokens(address(nullToken), address(llnuToken));
    hook.setNullMint(address(nullMint));
    nullMint.configure(address(hook), address(nullToken), address(llnuToken));

    hook.transferOwnership(ADMIN);
    nullToken.transferOwnership(ADMIN);
    llnuToken.transferOwnership(ADMIN);

    vm.stopBroadcast();

    console2.log("NullMint:", address(nullMint));
    console2.log("NullProtocolHook (v4):", address(hook));
    console2.log("NullToken:", address(nullToken));
    console2.log("LlnuToken:", address(llnuToken));
    console2.log("PoolManager:", poolManager);
    console2.log("LiquiditySeeder:", address(hook.liquiditySeeder()));
    console2.log("Mint target ETH (~$10k):", nullMint.MINT_TARGET_ETH());
    console2.log("Admin:", ADMIN);
  }
}
