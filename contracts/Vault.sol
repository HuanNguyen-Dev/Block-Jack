// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
contract Vault {
    // owner
    // for each address assign a uint256 (bal)
    
    // add logging e.g events for deposit, withdraw, payout

    // modifier for only the owner 
    address public owner;
    modifier onlyOwner(){
        require(msg.sender == owner, "Not owner");
        _;
    }
    // constructor to assign the owner

    constructor(){
        owner = msg.sender;
    }

    // deposit function extern payable

    // withdraw function takes amoutn

    // payout functrion (only owner) - takes player and amount

    // receive() payable due to deposit being a payable function



}