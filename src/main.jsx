// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/App.css';
import './styles/TabCollection.css';
import './styles/TabDeckLoader.css';
import './styles/TabMatching.css';
import './styles/TabMatchingLists.css'; // ⬅️ aggiunta questa
import { DeckProvider } from './context/DeckContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DeckProvider>
      <App />
    </DeckProvider>
  </React.StrictMode>
);

