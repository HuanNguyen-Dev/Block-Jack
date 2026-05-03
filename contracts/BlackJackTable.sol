// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IVault.sol";
import "./interfaces/IOracle.sol";
import "contracts/Data.sol";

contract BlackJackTable {
    // constructor for the addresses of the vault and oracle
    IVault public vault;
    IOracle public oracle;

    constructor(address _vault, address _oracle) {
        vault = IVault(_vault);
        oracle = IOracle(_oracle);
    }

    // auto increment counter for token id
    uint256 public nextGameID;
    // Limits
    uint256 constant lowLimit = 100 gwei;
    uint256 constant highLimit = 0.001 ether;
    uint8 constant deckSize = 104;

    // Every player has a game id
    mapping(address => uint256) activeGame;
    // Every game Id has a token
    mapping(uint256 => GameToken) games;

    // Events
    event GameCreated(uint256 tokenID, address player);
    event BetPlaced(
        uint256 tokenID,
        address player,
        uint256 bet,
        bytes32 finalSeed
    );
    event CardDrawn(address player, uint8 card);
    event GameEnded(address player, Result result);
    // Modifiers

    function assignToken(uint256 _playerSeed) external {
        require(activeGame[msg.sender] == 0, "Game already in progress");
        uint256 gameID = nextGameID++;
        activeGame[msg.sender] = gameID;

        GameToken storage token = games[gameID];
        // set the inital states of the token'
        token.tokenID = gameID;
        token.player = msg.sender;
        token.playerSeed = _playerSeed;
        token.drawIndex = 0;
        token.isActive = true;
        token.isShuffled = false;
        token.playerHandTotalValue = 0;
        token.dealerHandTotalValue = 0;
        token.isCompleted = false;
        token.bet = 0;

        emit GameCreated(token.tokenID, msg.sender);
    }

    function placeBets(uint256 bet) external {
        require(bet >= lowLimit && bet <= highLimit, "Bet out of range.");

        require(activeGame[msg.sender] != 0, "No active game currently");

        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];

        require(token.bet == 0, "Bet already placed");

        if (token.isActive || token.drawIndex > 0) {
            revert("Game already in progress");
        }
        token.bet = bet;

        token.finalSeed = oracle.generateSeed(token.serverSeed,token.playerSeed);

        // Shuffle the deck once
        shuffleDeck(token);

        emit BetPlaced(token.tokenID, msg.sender, token.bet, token.finalSeed);
    }

    // function rawToCard(uint8 raw) internal pure returns (Card memory){
    //     // Card value ranges from 1-13
    //     uint8 rank = (raw % 13) + 1;

    //     uint8 value;
    //     if (rank > 10){
    //         value= 10;
    //     }else{
    //         value = rank;
    //     }
    //     // Suits are 1 - 4 in order of hearts, diamonds clubs spades
    //     Suit suit = Suit(raw % 4);
    //     return Card(value, suit);
    // }



    function shuffleDeck(GameToken storage token) internal {
        // Setting out the deck, 0-3 represents AceH, AceD, AceC, AceS,
        // 4-7 represents 2H, 2D, 2C, 2S... etc
        // This is a two shoe deck
        for (uint8 i = 0; i < deckSize; i++) {
            token.deck[i] = i;
        }

        // Obtained from https://medium.com/@jannden/how-to-shuffle-an-array-in-solidity-fe08b028287d
        for (uint256 i = 0; i < deckSize; i++) {
            // Generate a random number
            uint256 n = i +
                ((uint256(token.finalSeed)) %
                    (deckSize - i));
            // Swap the location of the cards
            (token.deck[i], token.deck[n]) = (token.deck[n], token.deck[i]);
        }

        token.isShuffled = true;
    }

    function dealInitialHands(GameToken storage token) internal {
        require(token.isShuffled, "Deck has not been shuffled");
        // Player draws
        uint8 value = drawCard(token);
        (token.playerHandTotalValue, token.playerAceCount) = addCardToHand(
            value,
            token.playerHandTotalValue,
            token.playerAceCount
        );
        // Dealer Draws
        value = drawCard(token);
        (token.dealerHandTotalValue, token.dealerAceCount) = addCardToHand(
            value,
            token.dealerHandTotalValue,
            token.dealerAceCount
        );

        // Player Draws
        value = drawCard(token);
        (token.playerHandTotalValue, token.playerAceCount) = addCardToHand(
            value,
            token.playerHandTotalValue,
            token.playerAceCount
        );

        // Dealer Draws
        value = drawCard(token);
        (token.dealerHandTotalValue, token.dealerAceCount) = addCardToHand(
            value,
            token.dealerHandTotalValue,
            token.dealerAceCount
        );

        // Early exits
        if (
            hasBlackJack(token.playerHandTotalValue) &&
            !hasBlackJack(token.dealerHandTotalValue)
        ) {
            endGame(token, Result.PLAYER_WIN, token.bet * 2);
        }else if (hasBlackJack(token.playerHandTotalValue) 
                && hasBlackJack(token.dealerHandTotalValue)){
            endGame(token, Result.PUSH, token.bet);
        }else if (hasBlackJack(token.dealerHandTotalValue)) {
            endGame(token, Result.DEALER_WIN, 0);
        }
    }

    function hasBlackJack(uint8 currentTotal) internal pure returns (bool) {
        return currentTotal == 21;
    }

    function addCardToHand(
        uint8 card,
        uint8 currentTotal,
        uint8 aceCount
    ) internal pure returns (uint8, uint8) {
        // Initial ace will always be an 11 (card == 1 means ace)
        if (card == 1) {
            currentTotal += 11;
            aceCount += 1;
        } else {
            currentTotal += card;
        }

        // Keep converting the aces into 1's in case its over 21
        while (currentTotal > 21 && aceCount > 0) {
            currentTotal -= 10;
            aceCount -= 1;
        }
        return (currentTotal, aceCount);
    }

    function drawCard(GameToken storage token) internal returns (uint8) {
        require(token.isShuffled, "Deck has not been shuffled");
        uint8 raw = token.deck[token.drawIndex];
        // Map 13 cards
        uint8 value = (raw % 13) + 1;
        if (value > 10) value = 10;
        token.drawIndex++;
        // Emit raw value so we retain information on suits
        emit CardDrawn(token.player, raw);
        return value;
    }

    function hit() external {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        require(token.isActive, "No game is in progress");
        require(!token.isCompleted, "Game has already finished");

        uint8 card = drawCard(token);
        (token.playerHandTotalValue, token.playerAceCount) = addCardToHand(
            card,
            token.playerHandTotalValue,
            token.playerAceCount
        );
        if (token.playerHandTotalValue > 21) {
            endGame(token, Result.DEALER_WIN, 0);
        } else if (hasBlackJack(token.playerHandTotalValue)) {
            endGame(token, Result.PLAYER_WIN, token.bet * 2);
        }
    }

    function stand() external {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        require(token.isActive, "No game has been started");
        uint8 card;
        while (token.dealerHandTotalValue < 17) {
            card = drawCard(token);
            (token.dealerHandTotalValue, token.dealerAceCount) = addCardToHand(
                card,
                token.dealerHandTotalValue,
                token.dealerAceCount
            );
        }

        if (token.dealerHandTotalValue > 21) {
            endGame(token, Result.PLAYER_WIN, token.bet * 2);
        } else if (
            token.dealerHandTotalValue > token.playerHandTotalValue ||
            hasBlackJack(token.dealerHandTotalValue)
        ) {
            endGame(token, Result.DEALER_WIN, 0);
        } else if (token.dealerHandTotalValue == token.playerHandTotalValue) {
            endGame(token, Result.PUSH, token.bet);
        }
    }

    function endGame(
        GameToken storage token,
        Result result,
        uint256 payout
    ) internal {
        token.result = result;
        token.isCompleted = true;
        token.isActive = false;
        if (payout > 0) {
            vault.payout(token.player, payout);
        }
        delete activeGame[token.player];
        token.bet = 0;
        emit GameEnded(token.player, result);
    }
}
