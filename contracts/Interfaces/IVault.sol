// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache

interface IVault {
    function payout(address player, uint256 amount) external;
    function lockBet(address player, uint256 amount) external;
}