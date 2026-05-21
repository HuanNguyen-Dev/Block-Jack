import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PlaceBetDialogue from '../components/BetInput';
import PlaceDepositDialogue from '../components/DepositInput';
import { getBlackjackContract } from '../contract/blackjack-table';
import { getVaultContract } from '../contract/vault';
import DisplayMessage from '../components/NoBets';
import BackButton from '../components/BackButton';
import DisplayResults from '../components/DisplayResult';
import { parseEther } from "ethers";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { parseTxError } from '../utils';

function BlackjackTable() {
    const baseURL = 'https://deckofcardsapi.com/static/img/';
    const backOfCard = 'https://deckofcardsapi.com/static/img/back.png';
    const [isFanned, setisFanned] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null);

    const [gameState, setGameState] = useState(null);
    const [gameResult, setGameResult] = useState(null);
    const [playerHand, setPlayerHand] = useState([]);
    const [dealerHand, setDealerHand] = useState([]);
    const [playerTotal, setPlayerTotal] = useState(0);
    const [dealerTotal, setDealerTotal] = useState(0);
    const [betAmount, setBetAmount] = useState(0n);

    const [address, setAddress] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [openError, setOpenError] = useState(false);

    const [hasStand, setHasStand] = useState(false);
    const navigate = useNavigate();

    const STATES = {
        NONE: 0,
        BET: 1,
        DEALER_TURN: 2,
        PLAYER_TURN: 3,
        FINISHED: 4
    };

    const RESULT = {
        NONE: 0,
        PLAYER_WIN: 1,
        DEALER_WIN: 2,
        PUSH: 3
    }

    const getCardImage = (rawCard) => {

        const normalized = rawCard % 52;

        const rankIndex = Math.floor(normalized / 4);
        const suitIndex = normalized % 4;

        const suits = ['H', 'D', 'C', 'S'];

        let rank = '';

        if (rankIndex === 0) rank = 'A';
        else if (rankIndex >= 1 && rankIndex <= 8)
            rank = `${rankIndex + 1}`;
        else if (rankIndex === 9) rank = '0';
        else if (rankIndex === 10) rank = 'J';
        else if (rankIndex === 11) rank = 'Q';
        else if (rankIndex === 12) rank = 'K';

        return `${baseURL}${rank}${suits[suitIndex]}.png`;
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
                setGameState(STATES.NONE);
                return;
            }
            // gameid, bet, gamestate, playertotal, dealer total, shuffled,
            // drawindex, result, deck
            const game = await contract.getPlayerGame(player);
            setBetAmount(game.bet);
            setGameState(Number(game.gameState));
            setGameResult(Number(game.result));
            setPlayerTotal(Number(game.playerTotal));
            setDealerTotal(Number(game.dealerTotal));
            setHasStand(Number(game.gameState) == STATES.FINISHED);

            const hands = await contract.getHands(player);
            setPlayerHand(hands?.playerHand?.map(Number) || []);
            setDealerHand(hands?.dealerHand?.map(Number) || []);
        } catch (err) {
            console.error(err);

            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }

    const handleEndGame = async () => {
        try {
            const contract =
                await getBlackjackContract();

            const tx = await contract.endGame();

            await tx.wait();
            await loadGameData();
        } catch (err) {
            console.error(err);
            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }

    const renderHand = (hand, { hideDealerHole = false } = {}) => {
        const showHoleCard = gameState !== STATES.PLAYER_TURN;
        return (
            <div
                className="cards-container"
                style={{
                    position: 'relative',
                    height: '220px',
                    width: '100%',
                }}
            >
                <div
                    className="cards"
                    onClick={() => setisFanned(!isFanned)}
                >
                    {hand.map((card, index) => {

                        const middleIndex = Math.floor(hand.length / 2);

                        const angle = isFanned
                            ? (index - middleIndex) * 8
                            : 0;

                        const horizontalTranslation = isFanned
                            ? (index - middleIndex) * 30
                            : index * 5;

                        const hoverX = (index - middleIndex) * 2;
                        const hoverKey = `${card}-${index}`;

                        const isHovered = hoveredCard === hoverKey;
                        const isHoleCard = hideDealerHole && card === null;

                        const imageSrc =
                            isHoleCard ? backOfCard : getCardImage(card);

                        return (
                            <div
                                key={`${card}-${index}`}
                                className="card"
                                onMouseEnter={() =>
                                    setHoveredCard(hoverKey)
                                }
                                onMouseLeave={() =>
                                    setHoveredCard(null)
                                }
                                style={{
                                    position: 'absolute',

                                    transform: `
                                    rotate(${angle}deg)
                                    translateX(${(isHovered ? hoverX : 0) + horizontalTranslation}px)
                                    scale(${isHovered ? 1.3 : 1.15})
                                    translateY(${isHovered ? -40 : 0}px)
                                `,

                                    transformOrigin: 'bottom center',

                                    zIndex: isHovered
                                        ? hand.length + 10
                                        : index,

                                    transition: 'transform 0.25s ease',
                                }}
                            >
                                <img
                                    src={imageSrc}
                                    alt={`card-${card}`}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (gameState == null) {
        return (
            <>
                <BackButton></BackButton>
                <DisplayMessage
                    title={"Please Wait..."}
                    subtitle={"Loading..."}
                ></DisplayMessage>
            </>
        )
    }
    if (gameState == STATES.BET || gameState == STATES.NONE) {
        return (
            <>
                <BackButton></BackButton>
                <DisplayMessage
                    title={"No Bets Found! Please Place Your Bets"}
                    subtitle={"Waiting for user action..."}
                ></DisplayMessage>
            </>
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

                    <BackButton></BackButton>
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

                                onClick={handleDeal}>
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
    else if (hasStand) {
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

                    <img src={blackjackTableIMG} alt="Blackjack Table" className="table-image" />

                    <BackButton></BackButton>
                    {
                        gameResult == RESULT.DEALER_WIN ?
                            <DisplayResults
                                Result={"DEALER WINS"}>
                            </DisplayResults> :
                            gameResult == RESULT.PLAYER_WIN ?
                                <DisplayResults
                                    Result={"PLAYER WINS"}>
                                </DisplayResults>
                                :
                                <DisplayResults
                                    Result={"PUSH"}>
                                </DisplayResults>

                    }
                    {
                        < Stack direction="row"
                            spacing={2}
                            sx={{
                                position: 'relative',
                                zIndex: 10,
                                bottom: 80,
                            }}>
                            <button
                                className='base-button bet-button'

                                onClick={handleEndGame}>
                                End Game
                            </button>
                        </Stack>
                    }
                </Box >
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
        const displayDealerHand =
            dealerHand.length === 1
                ? [...dealerHand, null]
                : dealerHand;
        return (
            <>
                <Box
                    component="section"
                    className='blackjack-hero'
                    sx={{
                        position: 'relative',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100vh',
                        overflow: 'hidden',
                    }}
                >
                    <BackButton
                    ></BackButton>
                    <img
                        src={blackjackTableIMG}
                        alt="Blackjack Table"
                        className="table-image"
                    />

                    {/* Dealer Area */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 40,
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >

                        <Typography
                            sx={{
                                color: 'white',
                                mb: 2,
                                fontFamily: "'Pixelify Sans', sans-serif",
                                fontSize: '2rem',
                            }}
                        >
                            Dealer (
                            {
                                gameState === STATES.PLAYER_TURN
                                    ? '?'
                                    : dealerTotal
                            }
                            )
                        </Typography>
                        {renderHand(displayDealerHand, {
                            hideDealerHole: gameState === STATES.PLAYER_TURN
                        })}
                    </Box>

                    {/* Player Area */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 120,
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >

                        <Typography
                            sx={{
                                color: 'white',
                                mb: 2,
                                fontFamily: "'Pixelify Sans', sans-serif",
                                fontSize: '2rem',
                            }}
                        >
                            Player ({playerTotal})
                        </Typography>

                        {renderHand(playerHand)}
                    </Box>

                    {/* Buttons */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            position: 'absolute',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 20,
                        }}
                    >
                        <button
                            className='base-button bet-button'
                            onClick={handleStand}
                        >
                            Stand
                        </button>

                        <button
                            className='base-button bet-button'
                            onClick={handleHit}
                        >
                            Hit
                        </button>
                    </Stack>
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