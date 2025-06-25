import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/CardViewer.css';

function CardViewer({ card, onClose }) {
  const [showBack, setShowBack] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / 10);
    const rotateY = (x - centerX) / 10;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const resetTilt = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
    }
  };

  if (!card) return null;

  return createPortal(
    <div className="card-viewer-overlay" onClick={onClose}>
      <div className="card-viewer" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>
        <div
          className={`card-container ${showBack ? 'flipped' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          ref={cardRef}
        >
          <img
            className="card-face front"
            src={card.image_uris?.normal || card.image}
            alt={card.name}
          />
          <img
            className="card-face back"
            src="https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Ffr7g5swymhc41.png"
            alt="Retro carta"
          />
        </div>
        <button className="flip-btn" onClick={() => setShowBack((s) => !s)}>
          🔄 Flip
        </button>
        <div className="card-info">
          <h3>{card.name}</h3>
          <p className="type-line">{card.type_line}</p>
          {card.oracle_text && (
            <p
              className="oracle-text"
              dangerouslySetInnerHTML={{ __html: card.oracle_text.replace(/\n/g, '<br/>') }}
            ></p>
          )}
          {card.prices?.eur && <p className="price">€ {card.prices.eur}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CardViewer;
