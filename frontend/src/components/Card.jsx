import React from "react";

export default function Card({ card }) {
  if (!card) return null;

  return (
    <div className="card">
      <img
        src={card.image}
        alt={`${card.value} of ${card.suit}`}
        style={{ width: "100px" }}
      />
      <p>
        {card.value} of {card.suit}
      </p>
    </div>
      );
}