import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PlaceBetDialogue from '../components/BetInput';
import PlaceDepositDialogue from '../components/DepositInput';
import { getBlackjackContract } from '../contract/blackjack-table';
import { getVaultContract } from '../contract/vault';
import { parseEther } from "ethers";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { parseTxError } from '../utils';

function Deposit() {
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
            const locked = await vault.locked(player);

            setVaultBalance(balance);
            setNeedsDeposit(BigInt(balance.toString()) === 0n);
            setHasWagered(BigInt(locked.toString()) > 0n);
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
    if (needsDeposit == null) return (
        <>
            <Box
                component="section"
                className="blackjack-hero"
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100vh',
                    overflow: 'hidden',
                }}
            >
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
                {/* Background image */}
                <img
                    src={blackjackTableIMG}
                    alt="Blackjack Table"
                    className="table-image"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
                <Typography
                    variant="h3"
                    sx={{
                        color: '#fff',
                        fontWeight: 700,
                        mb: 1,
                        letterSpacing: 1,
                        fontFamily: "'Pixelify Sans', sans-serif",

                    }}
                >
                    Loading...
                </Typography>

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
                            <>
                                <button className='base-button bet-button'
                                    onClick={() => navigate('/BlackjackTable')}
                                    style={{
                                        position: "absolute",
                                        top: "250px",
                                        transform: "translateY(-20px)",
                                        zIndex: 10,
                                        padding: '10px 20px',
                                    }}>
                                    <span>Start Game</span>
                                </button>
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
                            :
                            <PlaceBetDialogue onPlaceBet={handlePlaceBet} />




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
export default Deposit;