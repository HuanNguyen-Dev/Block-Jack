# Block-Jack: A Blockchain-based Blackjack Casino

Block-Jack is a decentralized online blackjack casino application built using blockchain technology. The platform enables players to deposit, play, and withdraw using cryptocurrencies while eliminating intermediaries, ensuring fairness and transparency. All game results and financial transactions are publicly verifiable on the blockchain, providing a provably fair system for the users.

## Purpose

Block-Jack leverages smart contracts to create a secure and decentralized online blackjack platform. The application ensures that all game results are verifiable by both the player and the casino operator. A unique game token is generated for each game, containing relevant information such as the RNG seed, transactions, and more. These details are stored on the blockchain for transparency and fairness.

## Why Blockchain?

Blockchain technology is ideal for this application as it ensures transparency, provable fairness, and reduces the reliance on third-party intermediaries. All transactions are publicly verifiable, and the use of cryptocurrencies provides anonymity and lower transaction fees. By removing the need for intermediaries, players are provided with a cost-effective, secure, and decentralised platform to engage in blackjack.

## Smart Contracts

### Vault Contract

Manages all financial assets:
- **Deposit**: Allows players/operators to move cryptocurrency into the platform.
- **Withdraw**: Returns funds to the player’s wallet.
- **Payout**: Releases funds from the casino operator’s bankroll on a verified win.

### Oracle Contract

Ensures fairness by generating random data for the game:
- **Randomise**: Requests cryptographic proof from an external source to generate the shuffle.

### Blackjack Table Contract

Handles the gameplay:
- **assignToken**: Mints a game token with relevant game details.
- **playerAction**: Handles player actions like hit, stand, double-down, etc.
- **evaluateToken**: Verifies the outcome of the game and checks for a payout.

### Game Token

Each game session will have a unique game token that encapsulates:
- Token ID
- Player’s wallet address
- The wager amount in the Vault
- Player’s hand state
- Oracle Seed for card generation
- Outcome of the session

## Interactions Between Smart Contracts

1. **Vault Contract**:
   - **Deposit**: Both players and operators can deposit funds.
   - **Payout**: If the game token verifies a win, the Vault releases funds.

2. **Blackjack Table**:
   - **assignToken**: Generated when a player submits a wager.
   - **playerAction**: Updates the game token based on the player’s actions.
   - **evaluateToken**: Verifies the game result and determines if a payout is required.

3. **Oracle Contract**:
   - **Randomise**: Generates a random number and updates the game token with cryptographic proof.

## Technologies Used

- **Ethereum Smart Contracts** (Solidity)
- **Ethers.js** for frontend interaction
- **React** for frontend UI
- **Remix IDE** for smart contract development and deployment

## Future Enhancements

- **Wallet Integration**: Future improvements could include support for more wallet types and multiple cryptocurrency payments.
- **Game Features**: More game variations and improved user interaction can be added to enhance the gaming experience.
