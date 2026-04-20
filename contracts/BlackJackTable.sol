// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IVault.sol";   
import "./interfaces/IOracle.sol";
contract BlackJackTable {

    // constructor for the addresses of the vault and oracle

    // game token struct


    // make each addresss have a game token via the variable games

    // create events for token updates
    // - token assigned, action taken, game result

    // function to assign token payable
    // checks msg.sender and requires the msg.value to have a bet
    // initialise the msg.sender's game token and emit relevant logs

    // fucntion player action
    // gets game token of user and write it to storage
    // 
    // handle player action (e.g hit, stand, double down)
    // update relevant scores accordingly
    // emit logs accordingly
    // 


    // function evaluatetoken
    // writes the games of the user to storage
    // requires the token to currently not be in a game 
    // can check for a flag in the games struct
    // set active to false
    // check if player has won
    // - e.g beat dealer or 21
    // if win, call payout function via vault
    // emit logs accordingly
    // 
}