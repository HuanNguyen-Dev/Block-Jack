// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IVault.sol";
import "contracts/Data.sol";

//------------------------------------------------------------------------------
// vault contract
//
// manages all player eth balances and locked bets for the blackjack platform.
// players may deposit and withdraw eth, while the blackjacktable contract
// controls bets during gameplay.
//
// functionalities
// - store player balances within the platform
// - lock and release bets during active games
// - process payouts for wins and pushes
// - retain losing bets within the house balance
// - emit events for all balance-changing operations
//
// security assumptions:
// - only trusted game contracts should invoke settlement functions
// - eth transfers use low-level calls and revert on failure
//------------------------------------------------------------------------------


contract Vault is IVault {

    // owner
    uint256 public houseBalance;
    // for each address assign a uint256 (bal)
    mapping(address => uint256) public balances;

    // for each address assign a bet
    mapping(address => uint256) public locked;

//---------------------------------------------------------------------------------------

    // logging events for: Deposit, LockBet, Payout, Withdraw, LoseBet
    event Deposit(address user, uint256 amount);
    event LockBet(address player, uint256 balance, uint256 amount);
    event Payout(address indexed player, uint256 amount, Result result);
    event Withdraw(address indexed player, uint256 amount);
    event LoseBet(address indexed player, uint256 amount);

//---------------------------------------------------------------------------------------

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
//---------------------------------------------------------------------------------------

    /// deposit function allows player to deposit ETH from personal wallet into the vault
    function deposit() external payable override {
        require(msg.value > 0, "Deposit amount must be > 0");
        balances[msg.sender] += msg.value;

        houseBalance += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /// allows total ETH tracked by house balance to be read
    /// @return houseBalance the amount of ETH in house balance in wei
    function getHouseBalance() public view returns (uint256) {
        return houseBalance;
    }

    /// allows total eth held within contract balance to be read
    /// @return address(this).balance the ETH balance held in house wallet
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /// allows players ETH balance in the contract to be read
    ///@param player address of the players wallet
    ///@return player wallet balance
    function getPlayerBalance(address player) external view returns (uint256) {
        return balances[player];
    }

    /// lock the users bet amount prior to initialising game
    ///@param player the address of the players wallet
    ///@param amount the amount of the requested bet
    function lockBet(address player, uint256 amount) external override {
        require(balances[player] >= amount, "Insufficient balance");

        balances[player] -= amount;
        locked[player] += amount;
        emit LockBet(player, balances[player], amount);
    }
    
    /// allows a player to withdraw available (unlocked) ETH from their balance
    /// @param amount The amount of ETH to withdraw (in wei)
    function withdraw(uint256 amount) public {
        require(amount > 0, "Please enter withdrawal amount");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(houseBalance >= amount, "House insolvent");

        balances[msg.sender] -= amount;
        houseBalance -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit Withdraw(msg.sender, amount);
    }


    /// once game is finished pays out the player if they won or pushed
    /// @param player the wallet address of the player to pay out
    /// @param token the GameToken struct containing the bet amount, game state, and result
    function payout(
        address player,
        GameToken memory token
    ) public override {
        uint256 betAmount = token.bet;
        require(betAmount > 0, "Bet amount must be more than 0");
        require(locked[player] >= betAmount, "No active bet found");
        require(token.gameState == State.FINISHED, "Not finalised");

        locked[player] -= betAmount;
        // Player win
        if (token.result == Result.PLAYER_WIN) {
            uint256 payoutAmount = betAmount * 2;
            require(
                houseBalance >= payoutAmount,
                "House has insufficient funds"
            );

            houseBalance -= payoutAmount;

            (bool success, ) = player.call{value: payoutAmount}("");
            require(success, "Payout failed");
        } // Player push
        else if (token.result == Result.PUSH) {
            require(houseBalance >= betAmount, "House has insufficient funds");

            houseBalance -= betAmount;

            (bool success, ) = player.call{value: betAmount}("");
            require(success, "Payout failed");
        }

        emit Payout(player, betAmount, token.result);
    }

    // receive() payable due to deposit being a payable function
    receive() external payable {
        revert("Use deposit()");
    }

    /// in the case of a finished game where the dealer wins — house retains the locked ETH
    /// @param player The wallet address of the player
    /// @param token The GameToken struct containing the bet amount, game state, and result
    function loseBet(
        address player,
        GameToken memory token
    ) public override {
        uint256 betAmount = token.bet;
        require(locked[player] >= betAmount, "No active locked bet found");
        require(token.result == Result.DEALER_WIN, "Player has not lost");
        require(token.gameState == State.FINISHED, "Not finalised");
        // Deduct from players locked stake; house keeps eth in contract
        locked[player] -= betAmount;
        // House already owns ETH implicitly
        emit LoseBet(player, betAmount);
    }
}