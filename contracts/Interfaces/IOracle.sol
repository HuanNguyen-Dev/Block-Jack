// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "contracts/Data.sol";

interface IOracle {
    function generateSeed(uint256 playerSeed) external pure returns (bytes32);
}