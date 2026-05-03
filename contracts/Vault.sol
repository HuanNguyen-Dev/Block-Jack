// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
contract Vault {
    // owner
    // for each address assign a uint256 (bal)
    mapping(address => uint256) balances;
    // add logging e.g events for deposit, withdraw, payout

    // modifier for only the owner
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    // constructor to assign the owner

    constructor() {
        owner = msg.sender;
    }

    // deposit function extern payable
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be > 0");
        balances[msg.sender] += msg.value;
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    // withdraw function takes amoutn

    // payout functrion (only owner) - takes player and amount

    // receive() payable due to deposit being a payable function
}
