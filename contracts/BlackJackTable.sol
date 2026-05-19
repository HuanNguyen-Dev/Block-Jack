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
    uint256 public nextGameID = 1;
    // Limits
    uint256 constant lowLimit = 100 gwei; // 100,000,000,000
    uint256 constant highLimit = 0.001 ether; // 1,000,000,000,000,000
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
        uint256 finalSeed
    );
    event HandleTableEvents(GameToken token);
    event CardDrawn(address player, uint256 originalSeed, uint8 value,uint8[104]deck);
    event Shuffle(bytes tokenDeck, uint8[104] deck);
    event GameEnded(address player, Result result);
    event InitialHand(uint8 dealer, uint8 player);
    // Modifiers

    function getPlayerHand() public view returns ( uint8[] memory){
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        return token.playerHand;
    }

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
        token.isShuffled = false;
        token.gameState = State.BET;
        token.playerHandTotalValue = 0;
        token.dealerHandTotalValue = 0;
        token.bet = 0;


        emit GameCreated(token.tokenID, msg.sender);
    }

    function placeBets(uint256 bet) external {
        require(bet >= lowLimit && bet <= highLimit, "Bet out of range.");

        require(activeGame[msg.sender] != 0, "No active game currently");

        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];

        require(token.bet == 0, "Bet already placed");

        // needed?
        require(token.gameState == State.BET, "Token has not been assigned");
        vault.lockBet(msg.sender, bet);
        token.bet = bet;

        token.finalSeed = oracle.generateSeed(
            token.playerSeed
        );

        token.gameState = State.DEALER_TURN;

        // Shuffle the deck once
        shuffleDeck(token);

        emit BetPlaced(token.tokenID, msg.sender, token.bet, token.finalSeed);
    }



    function shuffleDeck(GameToken storage token) internal{
        require(
            token.gameState == State.DEALER_TURN,
            "Only the dealer can shuffle"
        );
        require(token.isShuffled == false, "Deck has already been shuffled");
        // Setting out the deck, 0-3 represents AceH, AceD, AceC, AceS,
        // 4-7 represents 2H, 2D, 2C, 2S... etc
        // This is a two shoe deck
        uint8[104] memory deck;
        for (uint8 i = 0; i < deckSize; i++) {
            deck[i] = i;
        }

        // Obtained from https://medium.com/@jannden/how-to-shuffle-an-array-in-solidity-fe08b028287d
        for (uint256 i = 0; i < deckSize; i++) {
            // Generate a random number
            uint256 n = i + ((uint256(token.finalSeed)) % (deckSize - i));
            // Swap the location of the cards
            (deck[i],deck[n]) = (deck[n], deck[i]);
        }
        token.deck = abi.encode(deck, token.finalSeed);
        token.isShuffled = true;
        emit Shuffle(token.deck, deck);
    }

    function settleFinalHands(GameToken storage token) internal returns (bool) {
        if (token.playerHandTotalValue > token.dealerHandTotalValue){
            endGame(token, Result.PLAYER_WIN, token.bet * 2);
            return true;
        }

        if (token.dealerHandTotalValue > token.playerHandTotalValue){
            endGame(token, Result.DEALER_WIN, token.bet);
            return true;
        }

        if (token.dealerHandTotalValue == token.playerHandTotalValue){
            endGame(token, Result.PUSH, token.bet);
            return true;
        }

        if (!handleBlackJackEvents(token)) return false;
        return false;
    }

    function handleBlackJackEvents(
        GameToken storage token
    ) internal returns (bool) {
        if (token.playerHandTotalValue > 21) {
            endGame(token, Result.DEALER_WIN, token.bet);
            return true;
        }

        if (token.dealerHandTotalValue > 21) {
            endGame(token, Result.PLAYER_WIN, token.bet * 2);
            return true;
        }

        if (
            hasBlackJack(token.playerHandTotalValue) &&
            !hasBlackJack(token.dealerHandTotalValue)
        ) {
            endGame(token, Result.PLAYER_WIN, token.bet * 2);
            return true;
        }

        if (
            hasBlackJack(token.playerHandTotalValue) &&
            hasBlackJack(token.dealerHandTotalValue)
        ) {
            endGame(token, Result.PUSH, token.bet);
            return true;
        }

        if (hasBlackJack(token.dealerHandTotalValue)) {
            endGame(token, Result.DEALER_WIN, token.bet);
            return true;
        }


        emit HandleTableEvents(token);
        return false;
    }

    function dealInitialHands() external {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        require(token.isShuffled, "Deck has not been shuffled");
        require(
            token.gameState == State.DEALER_TURN,
            "Only the dealer can deal hands"
        );

        _dealInitialHands(token);
    }

    function _dealInitialHands(GameToken storage token) internal {
        // Player draws
        _hitPlayer(token);
        // Dealer Draws
        _hitDealer(token);

        // Player Draws
        _hitPlayer(token);

        // // Dealer Draws
        // _hitDealer(token);

        // Early exits
        emit InitialHand(token.dealerHandTotalValue, token.playerHandTotalValue);
        if (handleBlackJackEvents(token)) return;

        token.gameState = State.PLAYER_TURN;
    }

    function hasBlackJack(uint8 currentTotal) internal pure returns (bool) {
        return currentTotal == 21;
    }

    function isAce(uint8 card) internal pure returns (bool) {
        return (card == 1 || card == 11);
    }

    function addCardToHand(
        uint8 card,
        uint8 currentTotal,
        uint8 aceCount
    ) internal pure returns (uint8, uint8) {
        // Handling multiple aces - treat ace as an 11 first
        if (isAce(card)) {
            currentTotal += 11;
            aceCount += 1;
        } else{
            currentTotal += card;
        }
        while(currentTotal > 21 && aceCount > 0){
            currentTotal -= 10;
            aceCount--;
        }
        return (currentTotal, aceCount);
    }

    function drawCard(GameToken storage token) internal returns (uint8) {
        require(token.isShuffled, "Deck has not been shuffled");
        (uint8[104] memory deck, uint256 originalSeed) = abi.decode(token.deck, (uint8[104], uint256));
        uint8 raw = deck[token.drawIndex];
        // Map 13 cards
        uint8 value = (raw % 13) + 1;
        if (value > 10 ) value = 10;
        token.drawIndex++;
        // Emit raw value so we retain information on suits
        emit CardDrawn(token.player, originalSeed, value, deck);
        return value;
    }

    function hitPlayer() external {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        require(token.gameState != State.FINISHED, "Game has already finished");
        require(
            token.gameState == State.PLAYER_TURN,
            "It is not the players turn"
        );
        require(token.playerHandTotalValue < 21, "Cannot hit");

        // handle blackjack
        _hitPlayer(token);
        bool ended = handleBlackJackEvents(token);
        if (ended) return;
    }

    function _hitPlayer(GameToken storage token) internal  returns (uint8){
        uint8 card = drawCard(token);
        (token.playerHandTotalValue,token.playerAceCount) = addCardToHand(
            card,
            token.playerHandTotalValue,
            token.playerAceCount
        );
        token.playerHand.push(card);
        return card;
    }

    function _hitDealer(GameToken storage token) internal {
        require(token.gameState == State.DEALER_TURN);
        uint8 card = drawCard(token);
        (token.dealerHandTotalValue, token.dealerAceCount) = addCardToHand(
            card,
            token.dealerHandTotalValue,
            token.dealerAceCount
        );
    }

    function stand() external {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        require(
            token.gameState == State.PLAYER_TURN,
            "No game has been started"
        );
        token.gameState = State.DEALER_TURN;
        while (token.dealerHandTotalValue < 17) {
            _hitDealer(token);
        }
        settleFinalHands(token);
    }

    function endGame(
        GameToken storage token,
        Result result,
        uint256 amount
    ) internal {
        token.result = result;
        token.gameState = State.FINISHED;
        if (amount > 0 && (token.result == Result.PLAYER_WIN || token.result == Result.PUSH) ) {
            vault.payout(token.player, amount, token);
        }
        else if(token.result == Result.DEALER_WIN){
            vault.loseBet(token.player, amount,token);
        }
        delete activeGame[token.player];
        token.bet = 0;
        emit GameEnded(token.player, result);
    }
}
