import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/CardViewer.css';

function CardViewer({ card, onClose }) {
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setShowBack((s) => !s);
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden'; // Previene lo scroll del body

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Gestione del tilt 3D migliorata
  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el || showBack) return; // Disabilita il tilt quando la carta è girata

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Limita l'intensità del tilt
    const maxTilt = 20;
    const rotateX = Math.max(-maxTilt, Math.min(maxTilt, -((y - centerY) / 8)));
    const rotateY = Math.max(-maxTilt, Math.min(maxTilt, (x - centerX) / 8));

    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
  };

  const resetTilt = () => {
    if (cardRef.current) {
      cardRef.current.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
  };

  // Gestione del click sull'overlay migliorata
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose?.();
    }
  };

  // Gestione del flip con animazione
  const handleFlip = () => {
    setShowBack((prev) => !prev);
    // Piccola vibrazione su dispositivi mobili
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Gestione del caricamento dell'immagine
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!card) return null;

  return createPortal(
    <div
      className="card-viewer-overlay"
      onClick={handleOverlayClick}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-title"
    >
      <div className="card-viewer" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Chiudi visualizzatore carta"
          title="Chiudi (Esc)"
        >
          ✖
        </button>

        <div
          className={`card-container ${showBack ? 'flipped' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          ref={cardRef}
          role="img"
          aria-label={`Carta Magic: ${card.name}`}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
              }}
            >
              Caricamento...
            </div>
          )}

          <img
            className="card-face front"
            src={card.image_uris?.normal || card.image}
            alt={`Fronte della carta ${card.name}`}
            onLoad={handleImageLoad}
            onError={() => setIsLoading(false)}
            style={{ opacity: isLoading ? 0 : 1 }}
          />

          <img
            className="card-face back"
            src="   /fr7g5swymhc41.png"
            alt="Retro della carta Magic"
            loading="lazy"
          />
        </div>

        <button
          className="flip-btn"
          onClick={handleFlip}
          aria-label={showBack ? 'Mostra fronte carta' : 'Mostra retro carta'}
          title="Gira carta (Spazio/Invio)"
        >
          🔄 {showBack ? 'Fronte' : 'Retro'}
        </button>

        <div className="card-info">
          <h3 id="card-title">{card.name}</h3>

          {card.type_line && <p className="type-line">{card.type_line}</p>}

          {card.oracle_text && (
            <div
              className="oracle-text"
              dangerouslySetInnerHTML={{
                __html: card.oracle_text
                  .replace(/\n/g, '<br/>')
                  .replace(
                    /\{([^}]+)\}/g,
                    '<span style="font-weight: bold; color: #a78bfa;">[$1]</span>'
                  ),
              }}
              role="region"
              aria-label="Testo della carta"
            />
          )}

          {card.power && card.toughness && (
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600',
                marginTop: '0.5rem',
              }}
            >
              Forza/Costituzione: {card.power}/{card.toughness}
            </p>
          )}

          {card.loyalty && (
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '600',
                marginTop: '0.5rem',
              }}
            >
              Fedeltà: {card.loyalty}
            </p>
          )}

          {card.prices?.eur && (
            <p className="price" aria-label={`Prezzo: ${card.prices.eur} euro`}>
              € {card.prices.eur}
            </p>
          )}

          {!card.prices?.eur && card.prices?.usd && (
            <p className="price" aria-label={`Prezzo: ${card.prices.usd} dollari`}>
              $ {card.prices.usd}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CardViewer;
