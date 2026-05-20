import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PlaceBetDialogue from '../components/BetInput';
import PlaceDepositDialogue from '../components/DepositInput';
import { getBlackjackContract } from '../contract/blackjack-table';
import { getVaultContract } from '../contract/vault';
import { parseEther } from "ethers";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { parseTxError } from '../utils';

function BlackjackTable() {
    const baseURL = 'https://deckofcardsapi.com/static/img/';
    const backOfCard = 'https://deckofcardsapi.com/static/img/back.png';
    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasWagered, setHasWagered] = useState(false);
    const [hasGame, setHasGame] = useState(false);
    const [vaultBalance, setVaultBalance] = useState(0n);
    const [needsDeposit, setNeedsDeposit] = useState(null);
    const [depositAmount, setDepositAmount] = useState("");
    const [address, setAddress] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [openError, setOpenError] = useState(false);
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
        const loadAddress = async () => {
            try {
                const contract = await getBlackjackContract();
                const player = await contract.runner.getAddress();

                setAddress(player);
            } catch (err) {
                console.error(err);
                setErrorMsg(parseTxError(err));
                setOpenError(true);

                return;
            }
        };

        loadAddress();
    }, []);


    useEffect(() => {
        if (!address) return;
        checkGame();
        checkBalance();
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

            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    };

    const checkBalance = async () => {
        try {
            const vault = await getVaultContract();
            const contract = await getBlackjackContract();

            const player = await contract.runner.getAddress();

            const balance = await vault.balances(player);

            setVaultBalance(balance);
            setNeedsDeposit(BigInt(balance.toString()) === 0n);
        } catch (err) {
            console.error("Balance check failed:", err);

            setErrorMsg(parseTxError(err));
            setOpenError(true);
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
            if (!hasGame) {
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
            setHasWagered(true);

        } catch (err) {
            console.error(err);

            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    };

    const checkGame = async () => {
        const contract = await getBlackjackContract();
        const player = await contract.runner.getAddress();

        const active = await contract.hasActiveGame(player);

        setHasGame(active);
    };

    return (
        <>
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
                        <PlaceDepositDialogue onPlaceDeposit={handleDeposit} />
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
            <Snackbar
                open={openError}
                autoHideDuration={4000}
                onClose={() => setOpenError(false)}
            >
                <Alert severity="error" variant="filled">
                    {errorMsg}
                </Alert>
            </Snackbar>
        </>

    )
}
export default BlackjackTable;