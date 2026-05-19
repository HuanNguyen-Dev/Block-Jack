// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "contracts/Data.sol";
interface IVault {
    function payout(address player, uint256 amount, GameToken memory token) external;
    function lockBet(address player, uint256 amount) external;
    function loseBet(address player, uint256 amount, GameToken memory token) external;
    function deposit() external payable;
}