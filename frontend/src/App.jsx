import sunImg from '/frontend/src/assets/sun.png'
import moonImg from '/frontend/src/assets/moon.png'
import heroImg from '/frontend/src/assets/heroMain.jpg'
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [cards, setCards] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <>
      <section id="center-index" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="title-container">
          <h1>Welcome To BlockJack</h1>
        </div>
        <div className="play-button"
          onClick={() => console.log('Play clicked')}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          <img src={sunImg} alt="Play Button" />
          {isHovered && (<div className="play-text">Play</div>)}
        </div>
        <div className="cards-container">
          <div className="cards">
            {isLoaded ? (
              cards.map((card, index) => {
                const middleIndex = Math.floor(cards.length / 2);
                const angle = (index - middleIndex) * 2.5;
                const horizontalTranslation = (index - middleIndex) * 50;
                return (
                  <div
                    key={card.code}
                    className="card"
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      transform: hoveredCard === index
                        ? `rotate(${angle}deg) translateX(${horizontalTranslation}px) scale(1.2) translateY(-30px)` // Scale and move on hover
                        : `rotate(${angle}deg) translateX(${horizontalTranslation}px)`, // Normal position
                      zIndex: cards.length - index, // To make sure cards appear in the right order
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
      </section>
    </>
  );
}

export default App
