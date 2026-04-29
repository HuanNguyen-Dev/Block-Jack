import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'
import { Box, Button, Stack } from '@mui/material'

function BlackjackTable() {
    const backOfCard = 'https://deckofcardsapi.com/static/img/back.png';
    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
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


    return (
        <Box
            component="section"
            className='blackjack-hero'
            sx={{
                display: 'flex',
                position: 'relative',
                flexDirection: 'column',
                width: '100%'
            }}
        >
            {/* <h1 className="table-title">Blackjack Table</h1> */}
            <img src={blackjackTableIMG} alt="Blackjack Table" className="table-image" />

            <Box
                sx={{
                    position: 'absolute',
                    bottom: 40,
                    display: 'flex',
                    justifyContent: 'center',
                }}>
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        color="error"
                        size="large"
                        sx={{
                            minWidth: '120px'
                        }}
                        onClick={() => console.log('Staned')}>
                        Stand
                    </Button>

                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        sx={{
                            minWidth: '120px'
                        }}
                        onClick={() => console.log('Hit')}>
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
            </Box>
        </Box>
    )
}
export default BlackjackTable;