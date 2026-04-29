// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache

        enum Result {
        NONE,
        PLAYER_WIN,
        DEALER_WIN,
        PUSH
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
        bool isActive;
        bool isCompleted;
        Result result;
        uint8[104] deck;
        bool isShuffled;
        uint8 playerHandTotalValue;
        uint8 playerAceCount;
        uint8 dealerHandTotalValue;
        uint8 dealerAceCount;
    }