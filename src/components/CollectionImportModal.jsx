import React, { useState, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import parseCollectionFromText from '../utils/parseCollection';
import useScryfall from '../hooks/useScryfall';
import '../styles/CollectionImportModal.css';

const CollectionImportModal = forwardRef(function CollectionImportModal(
  { initialText, onCancel, onAdd, onOverwrite },
  ref
) {
  const [text, setText] = useState(initialText);
  const [validated, setValidated] = useState(false);
  const [validCards, setValidCards] = useState([]);
  const [invalidCards, setInvalidCards] = useState([]);
  const scryfallData = useScryfall();

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

  return createPortal(
    <div className="import-modal-overlay" onClick={onCancel} ref={ref}>
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
              <div className="errors">
                <p>Non riconosciute:</p>
                <ul className="invalid-list">
                  {invalidCards.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="actions">
              <button onClick={() => onOverwrite(validCards)} disabled={validCards.length === 0}>
                Sovrascrivi collezione
              </button>
              <button onClick={() => onAdd(validCards)} disabled={validCards.length === 0}>
                Aggiungi a Collezione
              </button>
            </div>
          </>
        )}
        <button className="cancel" onClick={onCancel}>
          Annulla
        </button>
      </div>
    </div>,
    document.body
  );
});

export default CollectionImportModal;
