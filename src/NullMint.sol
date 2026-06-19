// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IMintableToken} from "./interfaces/IMintableToken.sol";
import {INullProtocolHook} from "./interfaces/INullProtocolHook.sol";

contract NullMint {
  address public constant ADMIN = 0xeB9c027FA55cEe6D722177f06441B451961731FC;

  uint256 public constant MINT_PRICE_ETH = 0.002 ether;
  uint256 public constant MAX_ETH_PER_ADDRESS = 0.1 ether;
  uint256 public constant MAX_SUPPLY = 100_000_000 * 10 ** 18;
  uint256 public constant TOKENS_PER_SHARE = 25_000 * 10 ** 18;
  uint256 public constant LLNU_PER_NULL = 2;
  uint256 public constant MINT_TARGET_ETH = 4 ether;
  uint256 public constant MINT_TARGET_USD6 = 10_000 * 10 ** 6;

  address public hook;
  IMintableToken public nullToken;
  IMintableToken public llnuToken;

  address public deployer;
  bool public configured;
  bool public mintEnded;
  bool public liquiditySeeded;

  uint256 public totalEthRaised;
  mapping(address => uint256) public ethSpent;

  event Minted(address indexed user, uint256 shares, uint256 nullAmount, uint256 llnuAmount, uint256 ethPaid);
  event MintEnded(uint256 timestamp);
  event LiquiditySeeded(uint256 ethAmount, uint256 nullAmount);
  event EthWithdrawn(address indexed to, uint256 amount);

  constructor() {
    deployer = msg.sender;
  }

  function configure(address _hook, address _null, address _llnu) external {
    require(msg.sender == deployer, "Not deployer");
    require(!configured, "Already configured");
    hook = _hook;
    nullToken = IMintableToken(_null);
    llnuToken = IMintableToken(_llnu);
    configured = true;
  }

  function mint(uint256 shares) external payable {
    _mintShares(shares, msg.sender);
  }

  function endMint() external {
    require(msg.sender == ADMIN, "Not admin");
    require(!mintEnded, "Already ended");
    mintEnded = true;
    emit MintEnded(block.timestamp);
    if (totalEthRaised >= MINT_TARGET_ETH && !liquiditySeeded) {
      _seedLiquidity();
    }
  }

  function withdrawEth(address payable to) external {
    require(msg.sender == ADMIN, "Not admin");
    require(to != address(0), "Zero address");
    uint256 amount = address(this).balance;
    require(amount > 0, "No ETH");
    (bool ok,) = to.call{value: amount}("");
    require(ok, "Transfer failed");
    emit EthWithdrawn(to, amount);
  }

  function mintProgressBps() external view returns (uint256) {
    if (MINT_TARGET_ETH == 0) return 0;
    if (totalEthRaised >= MINT_TARGET_ETH) return 10_000;
    return (totalEthRaised * 10_000) / MINT_TARGET_ETH;
  }

  receive() external payable {
    require(!mintEnded, "Mint ended");
  }

  function _mintShares(uint256 shares, address recipient) internal {
    require(configured, "Not configured");
    require(!mintEnded, "Mint ended");
    require(shares > 0, "Zero shares");

    uint256 ethCost = MINT_PRICE_ETH * shares;
    require(msg.value == ethCost, "Wrong ETH amount");
    require(ethSpent[recipient] + ethCost <= MAX_ETH_PER_ADDRESS, "Address cap");
    require(totalEthRaised + ethCost <= MINT_TARGET_ETH, "Mint cap");

    uint256 nullAmount = TOKENS_PER_SHARE * shares;
    uint256 llnuAmount = nullAmount * LLNU_PER_NULL;
    require(nullToken.totalSupply() + nullAmount <= MAX_SUPPLY, "Supply cap");
    require(llnuToken.totalSupply() + llnuAmount <= MAX_SUPPLY, "Llnu supply cap");

    ethSpent[recipient] += ethCost;
    totalEthRaised += ethCost;
    nullToken.mint(recipient, nullAmount);
    llnuToken.mint(recipient, llnuAmount);
    emit Minted(recipient, shares, nullAmount, llnuAmount, ethCost);

    if (totalEthRaised == MINT_TARGET_ETH) {
      mintEnded = true;
      emit MintEnded(block.timestamp);
      _seedLiquidity();
    }
  }

  function _seedLiquidity() internal {
    require(!liquiditySeeded, "Already seeded");
    uint256 ethAmount = address(this).balance;
    require(ethAmount > 0, "No ETH");

    uint256 nullForLp = (ethAmount * TOKENS_PER_SHARE) / MINT_PRICE_ETH;
    require(nullToken.totalSupply() + nullForLp <= MAX_SUPPLY, "LP supply cap");

    liquiditySeeded = true;
    nullToken.mint(hook, nullForLp);
    INullProtocolHook(hook).finalizeMintAndSeedLiquidity{value: ethAmount}(nullForLp);
    emit LiquiditySeeded(ethAmount, nullForLp);
  }
}
