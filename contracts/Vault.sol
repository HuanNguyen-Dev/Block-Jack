// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IVault.sol";

contract Vault is IVault {
    // owner
    // for each address assign a uint256 (bal)
    mapping(address => uint256) public balances;

    // for each address assign a bet
    mapping(address => uint256) public locked;

    // add logging e.g events for deposit, withdraw, payout
    event Deposit(address user, uint256 amount);
    event LockBet(address player, uint256 balance, uint256 amount);
    // modifier for only the owner
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    // constructor to assign the owner

    constructor() payable {
        // payable constructor can receive ether
        owner = payable(msg.sender);
    }

    // deposit function extern payable
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        balances[msg.sender] += msg.value;

        emit Deposit(msg.sender, msg.value);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getPlayerBalance(address player) external view returns (uint256) {
        return balances[player];
    }

    // lock the users bet
    function lockBet(address player, uint256 amount) external override {
        require(balances[player] >= amount, "Insufficient balance");
        require(player != address(0), "ZERO PLAYER");

        balances[player] -= amount;
        locked[player] += amount;
        emit LockBet(player, balances[player], amount);
    }
    // withdraw function takes amoutn

    // payout functrion (only owner) - takes player and amount
    function payout(address player, uint256 amount) external override {

    }
    // receive() payable due to deposit being a payable function
    receive() external payable {
        revert("Use deposit()");
    }
}
