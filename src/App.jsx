// src/App.jsx
import React, { useState } from 'react';
import TabDeckLoader from './tabs/TabDeckLoader';
import TabCollection from './tabs/TabCollection';
import TabMatching from './tabs/TabMatching';
import TabMatchingLists from './tabs/TabMatchingLists'; // ✅ import corretto
import './styles/App.css';

function App() {
  const [tab, setTab] = useState('loader');

  return (
    <div className="app-container">
      <header>
        <h1>MTG Visualizer</h1>
        <nav>
          <button onClick={() => setTab('loader')}>📦 Deck Loader</button>
          <button onClick={() => setTab('collection')}>🗃️ Collezione</button>
          <button onClick={() => setTab('matching')}>🧮 Matching</button>
          <button onClick={() => setTab('matchingLists')}>🔗 Match da Link</button>{' '}
          {/* ✅ nuova voce */}
        </nav>
      </header>
      <main>
        {tab === 'loader' && <TabDeckLoader />}
        {tab === 'collection' && <TabCollection />}
        {tab === 'matching' && <TabMatching />}
        {tab === 'matchingLists' && <TabMatchingLists />} {/* ✅ nuova tab */}
      </main>
    </div>
  );
}

export default App;

