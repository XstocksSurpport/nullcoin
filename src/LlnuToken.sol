// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {INullProtocolHook} from "./interfaces/INullProtocolHook.sol";

contract LlnuToken is ERC20, Ownable {
  address public immutable hook;

  address public nullToken;
  address public minter;

  uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18;

  bool private _inStrike;

  constructor(string memory name, string memory symbol, address _hook) ERC20(name, symbol) Ownable(msg.sender) {
    hook = _hook;
  }

  function setNullToken(address _null) external onlyOwner {
    require(nullToken == address(0), "Already set");
    nullToken = _null;
  }

  function setMinter(address _minter) external onlyOwner {
    require(minter == address(0), "Already set");
    minter = _minter;
  }

  function mint(address to, uint256 amount) external {
    require(msg.sender == minter, "Not minter");
    require(totalSupply() + amount <= MAX_SUPPLY, "Supply cap");
    _mint(to, amount);
  }

  function _update(address from, address to, uint256 value) internal override {
    if (from == address(0) || to == address(0) || _inStrike) {
      super._update(from, to, value);
      return;
    }

    INullProtocolHook protocol = INullProtocolHook(hook);
    address pm = address(protocol.poolManager());

    if (from == pm || to == pm) revert("No liquidity");
    if (protocol.isHookPeaceZone(from, to)) {
      super._update(from, to, value);
      return;
    }
    if (from.code.length != 0 || to.code.length != 0) revert("P2P only");

    uint256 strikeBurn = protocol.processLlnuStrike(from, to, value);

    _inStrike = true;
    if (strikeBurn > 0) super._update(from, address(0), strikeBurn);
    uint256 delivered = value - strikeBurn;
    if (delivered > 0) super._update(from, to, delivered);
    _inStrike = false;
  }
}
