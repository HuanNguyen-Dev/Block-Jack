import heroImg from '/frontend/src/assets/main.png'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, cardHeaderClasses } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { getBlackjackContract } from '../contract/blackjack-table';
import { getVaultContract } from '../contract/vault';
import WithdrawButton from '../components/Withdraw';
import { formatEther } from "ethers";
import { parseTxError } from '../utils';

function Home() {
    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [isFanned, setisFanned] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [openError, setOpenError] = useState(false);
    const [balance, setBalance] = useState("0");
    const [address, setAddress] = useState("");
    const [hasFinished, setHasFinished] = useState(false);
    const navigate = useNavigate();
    const STATES = {
        NONE: 0,
        BET: 1,
        DEALER_TURN: 2,
        PLAYER_TURN: 3,
        FINISHED: 4
    };



    const loadBalance = async () => {
        try {
            const vault = await getVaultContract();

            // get connected wallet
            const signerAddress = await vault.runner.getAddress();
            setAddress(signerAddress);

            // get vault balance
            const bal = await vault.balances(signerAddress);

            setBalance(formatEther(bal));
        } catch (err) {
            console.error("Failed to load balance:", err);
        }
    };

    const withdraw = async (amountInWei) => {
        try {
            const contract = await getVaultContract();
            const tx = await contract.withdraw(amountInWei);

            console.log("Transaction sent:", tx.hash);

            const receipt = await tx.wait();

            console.log("Withdraw confirmed:", receipt);
            await loadBalance();

            return receipt;
        } catch (err) {
            console.error("Withdraw failed:", err);
            setErrorMsg(parseTxError(err));
            setOpenError(true);

            return;
        }
    }

    const handleEndGame = async () => {
        try {
            const contract =
                await getBlackjackContract();

            const tx = await contract.endGame();

            await tx.wait();
            await loadGameState();
        } catch (err) {
            console.error(err);
            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }

    const loadGameState = async () => {
        try {
            const contract = await getBlackjackContract();
            const player = await contract.runner.getAddress();

            // 1. Check active game
            const active = await contract.hasActiveGame(player);


            if (!active) {
                return;
            }

            const game = await contract.getPlayerGame(player);
            setHasFinished(Number(game.gameState) == STATES.FINISHED);

        } catch (err) {
            console.error(err);

            setErrorMsg(parseTxError(err));
            setOpenError(true);
        }
    }


    useEffect(() => {
        if (!address) return;
        loadBalance();
        loadGameState();
    }, [address]);


    useEffect(() => {
        const fetchCards = async () => {
            try {
                // Fetch the deck of cards
                const deckRes = await fetch('https://deckofcardsapi.com/api/deck/new/?deck_count=1&shuffle=false');
                const deckData = await deckRes.json();
                const deckId = deckData.deck_id;

                // Fetch 21 cards from the deck
                const cardsRes = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=20`);
                const cardsData = await cardsRes.json();

                // Set the cards data to state
                setCards(cardsData.cards);
                setIsLoaded(true);
            } catch (error) {
                // handle gracefully later
                console.error('Error fetching cards:', error);
            }
        };

        fetchCards();
    }, []);

    function isHovered(index) {
        return hoveredCard === index;
    }

    return (
        <>
            <Box
                id="center-index"
                sx={{
                    position: "relative",
                    backgroundImage: `url(${heroImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '100vh',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    padding: 0,
                    margin: 0,
                }}>

                <div style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    zIndex: 999
                }}>
                    <div
                        className='base-button'
                        style={{
                            width: 200,
                            position: "absolute",
                            top: "60px",
                            zIndex: 999,
                            fontFamily: "'Pixelify Sans', sans-serif",
                            color: "white",
                            fontSize: "24px",
                            padding: "10px 16px",
                            borderRadius: "12px"
                        }}
                    >
                        Balance: {balance} ETH
                    </div>
                    <WithdrawButton onWithdraw={withdraw} />
                </div>
                {hasFinished ?
                    <button className='base-button bet-button'
                        onClick={handleEndGame}
                        style={{
                            position: 'relative',
                            marginBottom: '180px',
                            marginTop: '-40px',
                            zIndex: (cards.length + 1),
                        }}>
                        <span>End Game</span>
                    </button>   :
                    <button className='play-button'
                        onClick={() => navigate('/Deposit')}
                        style={{
                            position: 'relative',
                            marginBottom: '180px',
                            marginTop: '-40px',
                            zIndex: (cards.length + 1),
                        }}>
                        <span>Play</span>
                    </button>

                }

                <div className="cards-container" style={{ position: 'relative' }}>
                    <div className="cards"
                        onClick={() => setisFanned(!isFanned)}>
                        {isLoaded ? (
                            cards.map((card, index) => {
                                const middleIndex = Math.floor(cards.length / 2);
                                const angle = isFanned ? (index - middleIndex) * 0.8 : 0;
                                const horizontalTranslation = isFanned ? (index - middleIndex) * 20 : 0;
                                // move x depending on left or right of fan
                                const hoverX = (index - middleIndex) * 2;
                                return (
                                    <div
                                        key={card.code}
                                        className="card"
                                        //onClick={() => setSelectedCard(cardSelected === index ? null : index)}
                                        onMouseEnter={() => setHoveredCard(index)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        style={{
                                            transform: `rotate(${angle}deg) 
                      translateX(${(isHovered(index) ? hoverX : 0) + horizontalTranslation}px) 
                      scale(${isHovered(index) ? 1.3 : 1.2}) 
                      translateY(${isHovered(index) ? -110 : -60}px)`,
                                            zIndex: hoveredCard === index ? cards.length + 1 : index,
                                            transition: 'transform 0.25s ease',
                                        }}
                                    >
                                        <img src={card.image} alt={card.code} />
                                    </div>
                                )
                            })
                        ) : (
                            <p>Loading cards...</p>
                        )}
                    </div>
                </div>
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

export default Home;
