// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {INullToken} from "./interfaces/INullToken.sol";

contract NullToken is ERC20, Ownable, INullToken {
  address public immutable hook;
  address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

  address public llnuToken;
  address public minter;

  uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18;

  constructor(string memory name, string memory symbol, address _hook) ERC20(name, symbol) Ownable(msg.sender) {
    hook = _hook;
  }

  function setLlnuToken(address _llnu) external onlyOwner {
    require(llnuToken == address(0), "Already set");
    llnuToken = _llnu;
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

  function executeStrike(address victim, address striker, uint256 amount) external override {
    require(msg.sender == hook, "Only hook");
    require(victim != striker, "Self strike");
    require(amount > 0, "Zero amount");

    uint256 toDead = amount / 2;
    uint256 bounty = amount - toDead;
    if (toDead > 0) _transfer(victim, BURN_ADDRESS, toDead);
    if (bounty > 0) _transfer(victim, striker, bounty);
  }
}
