import React, { useState } from 'react';
import parseCollectionFromText from '../utils/parseCollection';
import scryfallData from '../data/scryfall-min.json';
import '../styles/CollectionImportModal.css';

function CollectionImportModal({ initialText, onCancel, onAdd, onOverwrite }) {
  const [text, setText] = useState(initialText);
  const [validated, setValidated] = useState(false);
  const [validCards, setValidCards] = useState([]);
  const [invalidCards, setInvalidCards] = useState([]);

  const validate = () => {
    const parsed = parseCollectionFromText(text);
    const valids = [];
    const invalids = [];
    Object.entries(parsed).forEach(([name, qty]) => {
      const match = scryfallData.find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (match) {
        valids.push({ name: match.name, qty });
      } else {
        invalids.push(name);
      }
    });
    setValidCards(valids);
    setInvalidCards(invalids);
    setValidated(true);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    setValidated(false);
  };

  return (
    <div className="import-modal-overlay" onClick={onCancel}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Verifica Lista Carte</h3>
        <textarea
          rows={8}
          value={text}
          onChange={handleTextChange}
          placeholder="1 Sol Ring\n2 Island"
        />
        <button onClick={validate}>Valida</button>
        {validated && (
          <>
            <p className="validate-msg">Riconosciute correttamente {validCards.length} carte</p>
            {invalidCards.length > 0 && (
              <p className="errors">Non riconosciute: {invalidCards.join(', ')}</p>
            )}
            <div className="actions">
              <button onClick={() => onOverwrite(validCards)}>Sovrascrivi collezione</button>
              <button onClick={() => onAdd(validCards)}>Aggiungi a Collezione</button>
            </div>
          </>
        )}
        <button className="cancel" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </div>
  );
}

export default CollectionImportModal;
