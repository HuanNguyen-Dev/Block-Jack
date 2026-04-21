import sunImg from '/frontend/src/assets/sun.png'
import moonImg from '/frontend/src/assets/moon.png'
import heroImg from '/frontend/src/assets/main.png'
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [cards, setCards] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isFanned, setisFanned] = useState(false);

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

  function isHovered(index){
    return hoveredCard === index;
  }

  return (
    <>
      <section id="center-index" style={{ backgroundImage: `url(${heroImg})` }}>
        <button className='play-button' style={{ transform: 'translate(-50%, calc(-50% - 120px))' }}>
          <span>Play</span>
        </button>
        <div className="cards-container">
          <div className="cards"
                onClick={() => setisFanned(!isFanned)}>
            {isLoaded ? (
              cards.map((card, index) => {
                const middleIndex = Math.floor(cards.length / 2);
                const angle =  isFanned ? (index - middleIndex) * 0.8 : 0;
                const horizontalTranslation = isFanned ? (index - middleIndex) * 20 : 0;
                // move x depending on left or right of fan
                const hoverX = (index - middleIndex) * 2; 
                return (
                  <div
                    key={card.code}
                    className="card"
                    onClick={() => setIsSelectedCard(cardSelected === index ? null : index)}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      transform: `rotate(${angle}deg) 
                      translateX(${(isHovered(index)? hoverX : 0 )+ horizontalTranslation   }px) 
                      scale(${isHovered(index) ? 1.3 : 1.2}) 
                      translateY(${isHovered(index) ? -130 : -100}px)`, 
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
      </section>
    </>
  );
}

export default App
