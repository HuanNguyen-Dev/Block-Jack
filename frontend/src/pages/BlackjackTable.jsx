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

function BlackjackTable() {
    const baseURL = 'https://deckofcardsapi.com/static/img/';
    const backOfCard = 'https://deckofcardsapi.com/static/img/back.png';
    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const [gameState, setGameState] = useState(null);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [playerTotal, setPlayerTotal] = useState(0);
    const [dealerTotal, setDealerTotal] = useState(0);
    const [betAmount, setBetAmount] = useState(0n);

    const [address, setAddress] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [openError, setOpenError] = useState(false);
    const navigate = useNavigate();

    const STATES = {
        NONE: 0,
        BET: 1,
        DEALER_TURN: 2,
        PLAYER_TURN: 3,
        FINISHED: 4
    };


    const handleDeal = async () => {
        try {
            const contract = await getBlackjackContract();

            const tx = await contract.dealInitialHands();

            await tx.wait();

            await loadGameData();

        } catch (err) {
            console.error(err);
            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    };

    const handleHit = async () => {
        try {
            const contract =
                await getBlackjackContract();

            const tx = await contract.hitPlayer();
            await tx.wait();
            await loadGameData();

        } catch (err) {
            console.error(err);
            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }

    const handleStand = async () => {
        try {
            const contract =
                await getBlackjackContract();

            const tx = await contract.stand();

            await tx.wait();
            await loadGameData();
        } catch (err) {
            console.error(err);
            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }

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

        loadGameData();
    }, [address]);

    const loadGameData = async () => {
        try {
            const contract = await getBlackjackContract();
            const player = await contract.runner.getAddress();

            // 1. Check active game
            const active = await contract.hasActiveGame(player);


            if (!active) {
                return;
            }
            // gameid, bet, gamestate, playertotal, dealer total, shuffled,
            // drawindex, result, deck
            const game = await contract.getPlayerGame(player);
            setBetAmount(game.bet);
            setGameState(Number(game.gameState));
            setPlayerTotal(Number(game.playerTotal));
            setDealerTotal(Number(game.dealerTotal));

            const hands = await contract.getHands(player);
            setPlayerHand(hands?.playerHand?.map(Number) || []);
            setDealerHand(hands?.dealerHand?.map(Number) || []);
        } catch (err) {
            console.error(err);

            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }
    if (gameState == null) {
        return (
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
        )
    }
    if (gameState == STATES.BET || gameState == STATES.NONE) {
        return (
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

                {/* Back button */}
                <button
                    className='play-button'
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        padding: '10px 20px',
                        zIndex: 20,
                    }}
                >
                    <span>Back</span>
                </button>

                {/* Center overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                    }}
                >
                    <Box
                        sx={{
                            px: 6,
                            py: 4,
                            borderRadius: 4,
                            textAlign: 'center',
                            backdropFilter: 'blur(8px)',
                            background: 'rgba(0,0,0,0.55)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }}
                    >
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
                            No Bets Found! Please Place Your Bets
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: '1.1rem',
                                fontFamily: "'Pixelify Sans', sans-serif",
                            }}
                        >
                            Waiting for player action...
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }
    else if (gameState == STATES.DEALER_TURN && dealerTotal == 0 && playerTotal == 0) {
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
                        <Stack direction="row"
                            spacing={2}
                            sx={{
                                position: 'relative',
                                zIndex: 10,
                                bottom: 80,
                            }}>
                            <button
                                className='base-button bet-button'

                                onClick={handleStand}>
                                Deal Hands
                            </button>
                        </Stack>
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
        );

    }
    else {
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
                        <Stack direction="row"
                            spacing={2}
                            sx={{
                                position: 'relative',
                                zIndex: 10,
                                bottom: 80,
                            }}>
                            <button
                                className='base-button bet-button'

                                onClick={handleStand}>
                                Stand
                            </button>

                            <button
                                className='base-button bet-button'
                                onClick={handleHit}>
                                Hit
                            </button>
                        </Stack>
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
}

export default BlackjackTable;