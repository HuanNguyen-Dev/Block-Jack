// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "contracts/Data.sol";

interface IOracle {
    function randomise(uint256 seed) external returns (uint256);
    function generateSeed(uint256 serverSeed, uint256 playerSeed) external pure returns (bytes32);
}