import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PlaceBetDialogue from '../components/BetInput';
import { getBlackjackContract } from '../contract/blackjack-table';

function BlackjackTable() {
    const baseURL = 'https://deckofcardsapi.com/static/img/';
    const backOfCard = 'https://deckofcardsapi.com/static/img/back.png';
    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasWagered, setHasWagered] = useState(false);
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

    const handlePlaceBet = async (betAmount) => {
        try {
            const contract = await getBlackjackContract();

            // Example seed
            const playerSeed = Date.now();

            // 1. assign token
            const tx1 = await contract.assignToken(playerSeed);
            await tx1.wait();

            // convert ETH -> wei
            const weiBet = BigInt(
                Number(betAmount) * 1e18
            );

            // 2. place bet
            const tx2 = await contract.placeBets(
                weiBet
            );

            await tx2.wait();

            console.log("Bet placed!");

            setHasWagered(true);

        } catch (err) {
            console.error(err);
        }
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
            {hasWagered ?
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