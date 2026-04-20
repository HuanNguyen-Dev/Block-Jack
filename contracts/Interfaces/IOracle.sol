// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache


interface IOracle {
    function randomise(uint256 seed) external returns (uint256);
}