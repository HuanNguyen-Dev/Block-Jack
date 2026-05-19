// interact with blackjack contract
[
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_playerSeed",
        "type": "uint256"
      }
    ],
    "name": "assignToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_vault",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_oracle",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "bet",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "finalSeed",
        "type": "uint256"
      }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "originalSeed",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "value",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8[104]",
        "name": "deck",
        "type": "uint8[104]"
      }
    ],
    "name": "CardDrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "dealInitialHands",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenID",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "GameCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum Result",
        "name": "result",
        "type": "uint8"
      }
    ],
    "name": "GameEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenID",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "bet",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "player",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "playerSeed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "serverSeed",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "finalSeed",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "drawIndex",
            "type": "uint8"
          },
          {
            "internalType": "enum State",
            "name": "gameState",
            "type": "uint8"
          },
          {
            "internalType": "enum Result",
            "name": "result",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "deck",
            "type": "bytes"
          },
          {
            "internalType": "bool",
            "name": "isShuffled",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "playerHandTotalValue",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "dealerHandTotalValue",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "playerAceCount",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "dealerAceCount",
            "type": "uint8"
          },
          {
            "internalType": "uint8[]",
            "name": "playerHand",
            "type": "uint8[]"
          }
        ],
        "indexed": false,
        "internalType": "struct GameToken",
        "name": "token",
        "type": "tuple"
      }
    ],
    "name": "HandleTableEvents",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "hitPlayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "dealer",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "player",
        "type": "uint8"
      }
    ],
    "name": "InitialHand",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "bet",
        "type": "uint256"
      }
    ],
    "name": "placeBets",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "tokenDeck",
        "type": "bytes"
      },
      {
        "indexed": false,
        "internalType": "uint8[104]",
        "name": "deck",
        "type": "uint8[104]"
      }
    ],
    "name": "Shuffle",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "stand",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlayerHand",
    "outputs": [
      {
        "internalType": "uint8[]",
        "name": "",
        "type": "uint8[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextGameID",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "oracle",
    "outputs": [
      {
        "internalType": "contract IOracle",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vault",
    "outputs": [
      {
        "internalType": "contract IVault",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]