// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30; // may have to change for ganache
import "./interfaces/IVault.sol";
import "./interfaces/IOracle.sol";
import "contracts/Data.sol";


//------------------------------------------------------------------------------
// blackjack table contract
//
// manages the core blackjack gameplay logic and state transitions for each
// active player session. the contract coordinates deck generation, card draws,
// hand evaluation, blackjack/bust detection, and final game settlement.
//
// functionalities:
// - create and track active player game sessions
// - generate and shuffle a two-shoe blackjack deck
// - manage player and dealer turns
// - evaluate blackjack, bust, push, and win conditions
// - interact with the vault contract for bet locking and settlement
// - interact with the oracle contract for randomness generation
// - emit gameplay events for frontend tracking and debugging
//
// gameplay flow:
// assign token -> place bet -> shuffle -> initial deal ->
// player actions -> dealer turn -> settlement -> payout/loss handling
//------------------------------------------------------------------------------

contract BlackJackTable {

    // constructor for the addresses of the vault and oracle
    IVault public vault;
    IOracle public oracle;
    constructor(address _vault, address _oracle) {
        vault = IVault(_vault);
        oracle = IOracle(_oracle);
    }
//---------------------------------------------------------------------------------------

    // auto increment counter for token id
    uint256 public nextGameID = 1;

    // Limits
    uint256 constant lowLimit = 100 gwei; // 100,000,000,000
    uint256 constant highLimit = 0.001 ether; // 1,000,000,000,000,000
    uint8 constant deckSize = 104;

    // Every player has a game id
    mapping(address => uint256) activeGame;

    // unique game Id token
    mapping(uint256 => GameToken) games;
//---------------------------------------------------------------------------------------

    // logging events for: GameCreated, BetPlaced, HandleTableEvents, CardDrawn, Shuffle, GameEnded, InitialHand
    event GameCreated(uint256 tokenID, address player);
    event BetPlaced(
        uint256 tokenID,
        address player,
        uint256 bet,
        uint256 finalSeed
    );
    event HandleTableEvents(GameToken token);
    event CardDrawn(
        address player,
        uint256 originalSeed,
        uint8 value,
        uint8[104] deck
    );
    event Shuffle(bytes tokenDeck, uint8[104] deck);
    event GameEnded(address player, Result result);
    event InitialHand(uint8 dealer, uint8 player);
    // Modifiers
//---------------------------------------------------------------------------------------

    /// allows players hand (cards) to be read as raw values
    /// @return token.playerHand the card represented as individual integers
    function getPlayerHand() public view returns (uint8[] memory) {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];
        return token.playerHand;
    }

    /// checks whether a player is already engaged in an active game
    /// @param player the wallet address of the player
    /// @return bool, true if player is in a game, false otherwise
    function hasActiveGame(address player) external view returns (bool) {
        return activeGame[player] != 0;
    }

    /// Returns the current game state for a given player
    /// @param player The wallet address of the player
    /// @return Gamestate of current game. current State enum value (BET, DEALER_TURN, PLAYER_TURN, FINISHED)
    function getGameState(address player) external view returns (State) {
        uint256 gameID = activeGame[player];

        require(gameID != 0, "No active game");

        return games[gameID].gameState;
    }

    /// Returns the full details of a player's active game
    /// @param player The wallet address of the player
    /// @return gameID The unique identifier for the game
    /// @return bet The amount of ETH bet
    /// @return gameState The current state of the game
    /// @return playerTotal The player's current hand total
    /// @return dealerTotal The dealer's current hand total
    /// @return shuffled Whether the deck has been shuffled
    /// @return drawIndex The index of the next card to be drawn
    /// @return result The result of the game
    /// @return deck The ABI-encoded deck and seed stored on the token
    function getPlayerGame(
        address player
    )
        external
        view
        returns (
            uint256 gameID,
            uint256 bet,
            State gameState,
            uint8 playerTotal,
            uint8 dealerTotal,
            bool shuffled,
            uint8 drawIndex,
            Result result,
            bytes memory deck
        )
    {
        gameID = activeGame[player];

        require(gameID != 0, "No active game");

        GameToken storage token = games[gameID];

        return (
            token.tokenID,
            token.bet,
            token.gameState,
            token.playerHandTotalValue,
            token.dealerHandTotalValue,
            token.isShuffled,
            token.drawIndex,
            token.result,
            token.deck
        );
    }

    /// returns both the player and dealer hands for a given player game
    /// @param player The wallet address of the player
    /// @return playerHand Array of raw card values in the player's hand
    /// @return dealerHand Array of raw card values in the dealer's hand
    function getHands(
        address player
    )
        external
        view
        returns (uint8[] memory playerHand, uint8[] memory dealerHand)
    {
        uint256 gameID = activeGame[player];

        require(gameID != 0, "No active game");

        GameToken storage token = games[gameID];

        return (token.playerHand, token.dealerHand);
    }

    /// creates a new game token for the calling player, only if there is no active game for the player
    /// @param _playerSeed A uint256 seed supplied by the player for randomness
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

    /// places a bet for the calling player and shuffles the deck, if all limits and requirements are met
    /// bet is locked in the Vault immediately. The final seed is generated, Game state advances to DEALER_TURN
    /// @param bet The amount of ETH to bet in wei, must be within low and high limit
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

        token.finalSeed = oracle.generateSeed(token.playerSeed);

        token.gameState = State.DEALER_TURN;

        // Shuffle the deck once
        shuffleDeck(token);

        emit BetPlaced(token.tokenID, msg.sender, token.bet, token.finalSeed);
    }

    /// shuffles the two-shoe deck using a Fisher-Yates algorithm seeded by finalSeed
    // Source: https://medium.com/@jannden/how-to-shuffle-an-array-in-solidity-fe08b028287d
    /// @param token The active GameToken storage reference to shuffle
    function shuffleDeck(GameToken storage token) internal {
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
            (deck[i], deck[n]) = (deck[n], deck[i]);
        }
        token.deck = abi.encode(deck, token.finalSeed);
        token.isShuffled = true;
        emit Shuffle(token.deck, deck);
    }

    /// compares final hand totals and sets the game result, falls through to handleBlackJackEvents() if neither total comparison resolves the game.
    /// @param token the active GameToken storage reference
    /// @return True if the game was successfully settled, false otherwise
    function settleFinalHands(GameToken storage token) internal returns (bool) {
        if (token.playerHandTotalValue > token.dealerHandTotalValue) {
            token.result = Result.PLAYER_WIN;
            token.gameState = State.FINISHED;
            return true;
        }

        if (token.dealerHandTotalValue > token.playerHandTotalValue) {
            token.result = Result.DEALER_WIN;
            token.gameState = State.FINISHED;
            return true;
        }

        if (token.dealerHandTotalValue == token.playerHandTotalValue) {
            token.result = Result.PUSH;
            token.gameState = State.FINISHED;
            return true;
        }

        if (!handleBlackJackEvents(token)) return false;
        return false;
    }
    
    /// handles special Blackjack outcomes (busts and natural blackjacks)
    /// check before and after the initial deal. Covers:
    ///      - Player bust (> 21) = DEALER_WIN
    ///      - Dealer bust (> 21) = PLAYER_WIN
    ///      - Player natural blackjack only = PLAYER_WIN
    ///      - Both natural blackjack = PUSH
    ///      - Dealer natural blackjack only = DEALER_WIN
    /// @param token the active GameToken storage reference
    /// @return True if a special condition was found and game is now FINISHED
    function handleBlackJackEvents(
        GameToken storage token
    ) internal returns (bool) {
        if (token.playerHandTotalValue > 21) {
            token.result = Result.DEALER_WIN;
            token.gameState = State.FINISHED;
            return true;
        }

        if (token.dealerHandTotalValue > 21) {
            token.result = Result.PLAYER_WIN;
            token.gameState = State.FINISHED;
            return true;
        }

        if (
            hasBlackJack(token.playerHandTotalValue) &&
            !hasBlackJack(token.dealerHandTotalValue)
        ) {
            token.result = Result.PLAYER_WIN;
            token.gameState = State.FINISHED;
            return true;
        }

        if (
            hasBlackJack(token.playerHandTotalValue) &&
            hasBlackJack(token.dealerHandTotalValue)
        ) {
            token.result = Result.PUSH;
            token.gameState = State.FINISHED;
            return true;
        }

        if (hasBlackJack(token.dealerHandTotalValue)) {
            token.result = Result.DEALER_WIN;
            token.gameState = State.FINISHED;
            return true;
        }

        emit HandleTableEvents(token);
        return false;
    }

    /// external entry point to deal the initial hands to player and dealer
    /// deck must be shuffled and game must be in DEALER_TURN state.
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

    /// deals hands to the player and dealer, then checks for early exits
    /// checks for blackjack/bust conditions. If none apply, advances state to PLAYER_TURN.
    /// @param token The active GameToken storage reference
    function _dealInitialHands(GameToken storage token) internal {
        // Player draws
        _hitPlayer(token);

        // Dealer Draws
        _hitDealer(token);

        // Player Draws
        _hitPlayer(token);

        // Early exits
        emit InitialHand(
            token.dealerHandTotalValue,
            token.playerHandTotalValue
        );
        if (handleBlackJackEvents(token)) return;

        token.gameState = State.PLAYER_TURN;
    }

    /// Checks if a hand total is blackjack (21)
    /// @param currentTotal The hand total to check
    /// @return True if the total equals 21
    function hasBlackJack(uint8 currentTotal) internal pure returns (bool) {
        return currentTotal == 21;
    }

    /// checks if a card value represents an ace
    /// @param card The card value to check
    /// @return True if the card is an Acea
    function isAce(uint8 card) internal pure returns (bool) {
        return (card == 1);
    }

    /// adds a card to a hand total, handling ace soft/hard logic
    /// aces are initially counted as 11. If the total exceeds 21 and an ace is in hand, it is demoted to 1
    /// @param card the card value to add (1–10)
    /// @param currentTotal the hand total before adding the card
    /// @param aceCount the number of Aces currently counted as 11
    /// @return updated hand total after adding the card
    /// @return updated ace count after any demotion
    function addCardToHand(
        uint8 card,
        uint8 currentTotal,
        uint8 aceCount
    ) internal pure returns (uint8, uint8) {
        // Handling multiple aces - treat ace as an 11 first
        if (isAce(card)) {
            currentTotal += 11;
            aceCount += 1;
        } else {
            currentTotal += card;
        }
        while (currentTotal > 21 && aceCount > 0) {
            currentTotal -= 10;
            aceCount--;
        }
        return (currentTotal, aceCount);
    }

    /// draws the next card from the shuffled deck
    /// @param token the active GameToken storage reference
    /// @return raw the raw deck index of the drawn card
    /// @return value the resolved card value (1–10, face cards = 10)
    function drawCard(GameToken storage token) internal returns (uint8 raw, uint8 value) {
        require(token.isShuffled, "Deck has not been shuffled");
        (uint8[104] memory deck, uint256 originalSeed) = abi.decode(
            token.deck,
            (uint8[104], uint256)
        );
        raw = deck[token.drawIndex];
        // Map 13 cards
        uint8 rank = (raw % 52) / 4;
        value = rank + 1;
        // 0-3 = ace, 4-7 = 2, etc
        if (value > 10) value = 10;
        token.drawIndex++;
        // Emit raw value so we retain information on suits
        emit CardDrawn(token.player, originalSeed, value, deck);
        return (raw, value);
    }

    /// allows the player to draw an additional card only callable during PLAYER_TURN
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

    /// logic to draw a card and add it to the player's hand
    /// @param token the active GameToken storage reference
    /// @return uint8 the value of the card drawn
    function _hitPlayer(GameToken storage token) internal returns (uint8) {
        (uint8 raw, uint8 value) = drawCard(token);
        (token.playerHandTotalValue, token.playerAceCount) = addCardToHand(
            value,
            token.playerHandTotalValue,
            token.playerAceCount
        );
        token.playerHand.push(raw);
        return value;
    }

    /// internal logic to draw a card and add it to the dealer's hand
    /// @param token the active GameToken storage reference
    function _hitDealer(GameToken storage token) internal {
        require(token.gameState == State.DEALER_TURN);
        (uint8 raw, uint8 value) = drawCard(token);
        (token.dealerHandTotalValue, token.dealerAceCount) = addCardToHand(
            value,
            token.dealerHandTotalValue,
            token.dealerAceCount
        );
        token.dealerHand.push(raw);
    }

    /// allows the player to stand, triggering the dealer's turn
    /// settleFinalHands() is called to determine the result.
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

    /// finalises the game, triggers Vault payout or loss, and clears the active game
    /// @return token the final GameToken state at the time of settlement
    function endGame() external returns (GameToken memory) {
        uint256 gameID = activeGame[msg.sender];
        GameToken storage token = games[gameID];

        require(token.gameState == State.FINISHED);

        if (
            token.bet > 0 &&
            (token.result == Result.PLAYER_WIN || token.result == Result.PUSH)
        ) {
            vault.payout(token.player, token);
        } else if (token.result == Result.DEALER_WIN) {
            vault.loseBet(token.player, token);
        }
        token.bet = 0;
        delete activeGame[token.player];
        emit GameEnded(token.player, token.result);
        return (token);
    }
}
