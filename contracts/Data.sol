// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache

enum Result {
    NONE,
    PLAYER_WIN,
    DEALER_WIN,
    PUSH
}

enum State {
    NONE,
    BET,
    DEALER_TURN,
    PLAYER_TURN,
    FINISHED
}

enum Suit {
    HEARTS,
    DIAMONDS,
    CLUBS,
    SPADES
}

struct Card {
    uint8 value;
    Suit suit;
}

// game token struct
struct GameToken {
    uint256 tokenID;
    uint256 bet;
    address player;
    uint256 playerSeed;
    uint256 serverSeed;
    bytes32 finalSeed;
    uint8 drawIndex;
    State gameState;
    Result result;
    uint8[104] deck;
    bool isShuffled;
    uint8 playerHandTotalValue;
    uint8 dealerHandTotalValue;
}
