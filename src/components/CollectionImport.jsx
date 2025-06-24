import React, { useState } from 'react';
import '../styles/CollectionImport.css';

function CollectionImport({ onImport }) {
  const [text, setText] = useState('');

  const handleImport = () => {
    if (text.trim()) {
      onImport(text);
      setText('');
    }
  };

  return (
    <div className="collection-import">
      <h3>📥 Importa da Lista</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Incolla qui la tua lista di carte (es. 1 Sol Ring)..."
        rows="8"
      />
      <button onClick={handleImport} disabled={!text.trim()}>
        Importa nella Collezione
      </button>
    </div>
  );
}

export default CollectionImport;
