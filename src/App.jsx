// src/App.jsx
import React, { useState } from "react";
import TabCollection from "./tabs/TabCollection";
import TabMatching from "./tabs/TabMatching";
import TabMatchingLists from "./tabs/TabMatchingLists";
import TabMyDecks from "./tabs/TabMyDecks";
import DeckLoaderInit from "./components/DeckLoaderInit";
import StartupModal from "./components/StartupModal";
import CollectionLoaderInit from "./components/CollectionLoaderInit";
import Footer from "./components/Footer";
import "./styles/App.css";

function App() {
  const [tab, setTab] = useState("collection");
  const [isAppReady, setIsAppReady] = useState(false);

  const handleStartupComplete = () => {
    setIsAppReady(true);
  };

  return (
    <div className="app-container">
      {!isAppReady && <StartupModal onComplete={handleStartupComplete} />}
      <CollectionLoaderInit />
      <DeckLoaderInit /> {/* 🔁 Caricamento mazzi automatico */}
      <header className={!isAppReady ? "app-loading" : ""}>
        <h1>MTG Visualizer</h1>
        <nav>
          <button onClick={() => setTab("collection")}>🗃️ Collezione</button>
          <button onClick={() => setTab("matching")}>🧮 Matching</button>
          <button onClick={() => setTab("matchingLists")}>
            🔗 Match da Lista
          </button>
          <button onClick={() => setTab("myDecks")}>📚 I miei Deck</button>
        </nav>
      </header>
      <main className={!isAppReady ? "app-loading" : ""}>
        {tab === "collection" && <TabCollection />}
        {tab === "matching" && <TabMatching />}
        {tab === "matchingLists" && <TabMatchingLists />}
        {tab === "myDecks" && <TabMyDecks />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
