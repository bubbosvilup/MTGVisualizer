// src/App.jsx
import React, { useState } from 'react';
import TabCollection from './tabs/TabCollection';
import TabMatching from './tabs/TabMatching';
import TabMatchingLists from './tabs/TabMatchingLists';
import TabDeckBuilder from './tabs/TabDeckBuilder';
import DeckLoaderInit from './components/DeckLoaderInit';
import StartupModal from './components/StartupModal';
import CollectionLoaderInit from './components/CollectionLoaderInit';
import './styles/App.css';

function App() {
  const [tab, setTab] = useState('collection');
  const [isAppReady, setIsAppReady] = useState(false);

  const handleStartupComplete = () => {
    setIsAppReady(true);
  };

  return (
    <div className="app-container">
      {!isAppReady && <StartupModal onComplete={handleStartupComplete} />}
      <CollectionLoaderInit />
      <DeckLoaderInit /> {/* 🔁 Caricamento mazzi automatico */}
      <header className={!isAppReady ? 'app-loading' : ''}>
        <h1>MTG Visualizer</h1>
        <nav>
          <button onClick={() => setTab('collection')}>🗃️ Collezione</button>
          <button onClick={() => setTab('matching')}>🧮 Matching</button>
          <button onClick={() => setTab('matchingLists')}>🔗 Match da Lista</button>
          <button onClick={() => setTab('builder')}>⚒️ Builder</button>
        </nav>
      </header>
      <main className={!isAppReady ? 'app-loading' : ''}>
        {tab === 'collection' && <TabCollection />}
        {tab === 'matching' && <TabMatching />}
        {tab === 'matchingLists' && <TabMatchingLists />}
        {tab === 'builder' && <TabDeckBuilder />}
      </main>
      <footer className="mtg-footer">
        <span>“Gather your deck. Ignite your spark.”</span>
        <span className="pw-icon">&#9875;</span>
      </footer>
    </div>
  );
}

export default App;

