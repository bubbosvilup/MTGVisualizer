import React, { useState } from "react";
import "../styles/TabMyDecks.css";

function TabMyDecks() {
  const [username, setUsername] = useState("");
  const [decks, setDecks] = useState([]);

  const handleSearch = () => {
    // TODO: fetch decks from Moxfield by username
    setDecks([]);
  };

  return (
    <div className="tab-my-decks">
      <h2>📚 I miei Deck</h2>
      <div className="search-bar">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nome utente Moxfield"
        />
        <button onClick={handleSearch} disabled={!username.trim()}>
          Cerca
        </button>
      </div>
      <div className="deck-list">
        {decks.length === 0 ? (
          <p>Nessun deck caricato.</p>
        ) : (
          <ul>
            {decks.map((deck) => (
              <li key={deck.id}>{deck.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TabMyDecks;
