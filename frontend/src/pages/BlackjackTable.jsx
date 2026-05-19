import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PlaceBetDialogue from '../components/BetInput';
import { getBlackjackContract } from '../contract/blackjack-table';
import { getVaultContract } from '../contract/vault';
import { parseEther } from "ethers";

function BlackjackTable() {
    const baseURL = 'https://deckofcardsapi.com/static/img/';
    const backOfCard = 'https://deckofcardsapi.com/static/img/back.png';
    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasWagered, setHasWagered] = useState(false);
    const [gameId, setGameId] = useState(0n);
    const [vaultBalance, setVaultBalance] = useState(0n);
    const [needsDeposit, setNeedsDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [address, setAddress] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCards = async () => {
            try {
                // Fetch two decks of cards
                const deckRes = await fetch('https://deckofcardsapi.com/api/deck/new/?deck_count=2&shuffle=false');
                const deckData = await deckRes.json();
                const deckId = deckData.deck_id;

                // fetch the entire deck
                const cardsRes = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=52`);
                const cardsData = await cardsRes.json();

                // Set the cards data to state
                setCards(cardsData.cards);
                setIsLoaded(true);

                // Maybe send hash of deck to solidity and store it in blockchain


            } catch (error) {
                // handle gracefully later
                console.error('Error fetching cards:', error);
            }
        };

        fetchCards();
    }, []);


    useEffect(() => {
        const checkBalance = async () => {
            try {
                const vault = await getVaultContract();
                const contract = await getBlackjackContract();

                const player = await contract.runner.getAddress();

                // assumes Vault has: balances[address]
                const balance = await vault.balances(player);

                setVaultBalance(balance);

            } catch (err) {
                console.error("Balance check failed:", err);
            }
        };

        checkBalance();
    }, []);

    useEffect(() => {
        const loadAddress = async () => {
            try {
                const contract = await getBlackjackContract();
                const player = await contract.runner.getAddress();

                setAddress(player);
            } catch (err) {
                console.error(err);
            }
        };

        loadAddress();
    }, []);


    useEffect(() => {
        if (!address) return;
        checkGame();
    }, [address]);
    const handleDeposit = async (amountEth) => {
        try {
            const vault = await getVaultContract();

            const tx = await vault.deposit({
                value: parseEther(amountEth.toString())
            });

            setDepositAmount(amountEth);
            await tx.wait();

            setNeedsDeposit(false);
            await checkBalance();
            console.log("Deposit successful");

        } catch (err) {
            console.error(err);
        }
    };

    const checkBalance = async () => {
        try {
            const vault = await getVaultContract();
            const contract = await getBlackjackContract();

            const player = await contract.runner.getAddress();

            const balance = await vault.balances(player);

            setVaultBalance(balance);

            setNeedsDeposit(balance === 0n);
        } catch (err) {
            console.error("Balance check failed:", err);
        }
    };

    const handlePlaceBet = async (betAmount) => {
        try {
            const contract = await getBlackjackContract();

            if (needsDeposit) {
                console.log("User must deposit first");
                return;
            }
            // Example seed
            const playerSeed = Date.now();
            // 1. assign token
            if (gameId === 0n) {
                const tx1 = await contract.assignToken(playerSeed);
                await tx1.wait();
                await checkGame();
            }

            // convert ETH -> wei
            const weiBet = parseEther(betAmount.toString());

            // 2. place bet
            const tx2 = await contract.placeBets(
                weiBet
            );

            await tx2.wait();
            await checkGame();
            console.log("Bet placed!");
            setHasWagered(gameId !== 0n);

        } catch (err) {
            console.error(err);
        }
    };

    const checkGame = async () => {
        const contract = await getBlackjackContract();
        const player = await contract.runner.getAddress();

        const id = await contract.activeGame(player);

        setGameId(BigInt(id));
    };

    return (

        <Box
            component="section"
            className='blackjack-hero'
            sx={{

                position: 'relative',
                flexDirection: 'column',
                width: '100%',
                height: '100%'
            }}
        >
            {/* <h1 className="table-title">Blackjack Table</h1> */}
            <img src={blackjackTableIMG} alt="Blackjack Table" className="table-image" />

            <button className='play-button'
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    padding: '10px 20px',
                }}>
                <span>Back</span>
            </button>
            {
                needsDeposit ? (
                    <Stack>
                        <Button onClick={() => handleDeposit("0.01")}>
                            Deposit to Vault
                        </Button>
                    </Stack>
                ) :
                    hasWagered ?
                        <Stack direction="row"
                            spacing={2}
                            sx={{
                                position: 'relative',
                                zIndex: 10,
                                bottom: 80,
                            }}>
                            <Button
                                variant="contained"
                                color="error"
                                size="large"
                                sx={{
                                    minWidth: '120px'
                                }}
                                onClick={async () => {
                                    const contract =
                                        await getBlackjackContract();

                                    const tx = await contract.stand();

                                    await tx.wait();
                                }}>
                                Stand
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                size="large"
                                sx={{
                                    minWidth: '120px'
                                }}
                                onClick={async () => {
                                    const contract =
                                        await getBlackjackContract();

                                    const tx = await contract.hitPlayer();

                                    await tx.wait();
                                }}>
                                Hit
                            </Button>

                            <Button
                                variant="contained"
                                color="warning"
                                size="large"
                                sx={{
                                    minWidth: '120px'
                                }}
                                onClick={() => console.log('Double Down')}>
                                Double Down
                            </Button>
                        </Stack>
                        : <PlaceBetDialogue onPlaceBet={handlePlaceBet} />



            }
        </Box>

    )
}
export default BlackjackTable;