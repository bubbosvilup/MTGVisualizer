// src/App.jsx
import React, { useState } from 'react';
import TabCollection from './tabs/TabCollection';
import TabMatching from './tabs/TabMatching';
import TabMatchingLists from './tabs/TabMatchingLists';
import DeckLoaderInit from './components/DeckLoaderInit';
import './styles/App.css';

function App() {
  const [tab, setTab] = useState('collection');

  return (
    <div className="app-container">
      <DeckLoaderInit /> {/* 🔁 Caricamento mazzi automatico */}
      <header>
        <h1>MTG Visualizer</h1>
        <nav>
          <button onClick={() => setTab('collection')}>🗃️ Collezione</button>
          <button onClick={() => setTab('matching')}>🧮 Matching</button>
          <button onClick={() => setTab('matchingLists')}>🔗 Match da Lista</button>
        </nav>
      </header>
      <main>
        {tab === 'collection' && <TabCollection />}
        {tab === 'matching' && <TabMatching />}
        {tab === 'matchingLists' && <TabMatchingLists />}
      </main>
    </div>
  );
}

export default App;

