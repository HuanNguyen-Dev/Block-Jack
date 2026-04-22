import React from 'react';
import blackjackTableIMG from '../assets/blackjack-table-pixilart.png'
import { useEffect, useState } from 'react'


function BlackjackTable() {

    const [cards, setCards] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        const fetchCards = async () => {
            try {
                // Fetch two decks of cards
                const deckRes = await fetch('https://deckofcardsapi.com/api/deck/new/?deck_count=2&shuffle=true');
                const deckData = await deckRes.json();
                const deckId = deckData.deck_id;

                // fetch the entire deck
                const cardsRes = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=104`);
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
        <section className="blackjack-hero">
            {/* <h1 className="table-title">Blackjack Table</h1> */}
            <img src={blackjackTableIMG} alt="Blackjack Table" className="table-image" />
        </section>
    );
}

export default BlackjackTable;