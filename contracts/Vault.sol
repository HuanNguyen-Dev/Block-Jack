// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IVault.sol";
import "contracts/Data.sol";

contract Vault is IVault {
    // owner
    // for each address assign a uint256 (bal)
    mapping(address => uint256) public balances;

    // for each address assign a bet
    mapping(address => uint256) public locked;

    // add logging e.g events for deposit, withdraw, payout
    event Deposit(address user, uint256 amount);
    event LockBet(address player, uint256 balance, uint256 amount);
    event Payout(address indexed player, uint256 amount, Result result);
    event Withdraw(address indexed player, uint256 amount);
    event LoseBet(address indexed player, uint256 amount);


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
    function deposit() external override payable {
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
    // withdraw function takes amount

        function withdraw(uint256 amount) public {
        require(amount > 0, "Please enter withdrawal amount");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdraw(msg.sender, amount);
    }

    // payout functrion (only owner) - takes player and amount
    function payout(address player, uint256 betAmount, GameToken memory token) public override{
        require(betAmount > 0, "Bet amount must be more than 0");
  
        require(balances[owner] >= betAmount * 2 && token.result == Result.PLAYER_WIN, "House has insufficient funds");
         require(balances[owner] >= betAmount && token.result == Result.PUSH, "House has insufficient funds");
        require(locked[player] >= betAmount, "No active bet found");

        locked[player] -= betAmount;
        bool success = false;
        if (token.result == Result.PLAYER_WIN) (success, ) = player.call{value: betAmount * 2}("");
        else if (token.result == Result.PUSH)(success, ) = player.call{value: betAmount}("");
        require(success, "Payout failed");

        emit Payout(player, betAmount, token.result);
    }
    // receive() payable due to deposit being a payable function
    receive() external payable {
        revert("Use deposit()");
    }

    function loseBet(address player, uint256 betAmount, GameToken memory token) public override {
        require(locked[player] >= betAmount, "No active locked bet found");
        require(token.result == Result.DEALER_WIN, "Player has not lost");
        // Deduct from players locked stake; house keeps eth in contract
        locked[player] -= betAmount;

        emit LoseBet(player, betAmount);
    }
}
