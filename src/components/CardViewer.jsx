import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import '../styles/CardViewer.css';

// Hook personalizzato per gestire le particelle con performance ottimizzate
const useParticleSystem = (isActive) => {
  const [particles, setParticles] = useState([]);
  const animationFrameRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const particlePoolRef = useRef([]);

  // Pool di particelle per evitare allocazioni continue
  const getParticleFromPool = useCallback(() => {
    if (particlePoolRef.current.length > 0) {
      return particlePoolRef.current.pop();
    }
    return {
      id: 0,
      x: 0,
      y: 0,
      size: 0,
      opacity: 0,
      speed: 0,
      direction: 0,
      color: '',
      life: 0,
      maxLife: 0,
    };
  }, []);

  const returnParticleToPool = useCallback((particle) => {
    particlePoolRef.current.push(particle);
  }, []);

  const generateParticles = useCallback(() => {
    if (!isActive) return;

    const colors = ['#6c63ff', '#a78bfa', '#ec4899', '#fbbf24', '#10b981'];
    const newParticles = Array.from({ length: 4 }, (_, i) => {
      const particle = getParticleFromPool();
      particle.id = Date.now() + i;
      particle.x = Math.random() * 100;
      particle.y = Math.random() * 100;
      particle.size = Math.random() * 5 + 3;
      particle.opacity = Math.random() * 0.8 + 0.2;
      particle.speed = Math.random() * 1.5 + 0.5;
      particle.direction = Math.random() * Math.PI * 2;
      particle.color = colors[Math.floor(Math.random() * colors.length)];
      particle.life = 0;
      particle.maxLife = Math.random() * 2000 + 1000;
      return particle;
    });

    setParticles((prev) => [...prev.slice(-15), ...newParticles]);
  }, [isActive, getParticleFromPool]);

  const updateParticles = useCallback(
    (currentTime) => {
      if (currentTime - lastUpdateRef.current < 16) return; // 60fps limit

      setParticles((prev) => {
        const updated = prev
          .map((particle) => {
            particle.life += 16;
            const lifeRatio = particle.life / particle.maxLife;

            return {
              ...particle,
              x: (particle.x + Math.cos(particle.direction) * particle.speed) % 100,
              y: (particle.y + Math.sin(particle.direction) * particle.speed) % 100,
              opacity: particle.opacity * (1 - lifeRatio * 0.02),
              size: particle.size * (1 - lifeRatio * 0.001),
            };
          })
          .filter((particle) => {
            if (particle.opacity <= 0.05 || particle.life >= particle.maxLife) {
              returnParticleToPool(particle);
              return false;
            }
            return true;
          });

        lastUpdateRef.current = currentTime;
        return updated;
      });
    },
    [returnParticleToPool]
  );

  useEffect(() => {
    if (!isActive) return;

    const animate = (currentTime) => {
      updateParticles(currentTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    const intervalId = setInterval(generateParticles, 600);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(intervalId);
    };
  }, [isActive, updateParticles, generateParticles]);

  return particles;
};

// Hook per gestire l'effetto tilt 3D ottimizzato
const useTiltEffect = (cardRef, isFlipping) => {
  const [tiltState, setTiltState] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef(null);

  const updateTilt = useCallback((targetState) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      setTiltState((prev) => ({
        rotateX: prev.rotateX + (targetState.rotateX - prev.rotateX) * 0.1,
        rotateY: prev.rotateY + (targetState.rotateY - prev.rotateY) * 0.1,
        scale: prev.scale + (targetState.scale - prev.scale) * 0.1,
      }));
    });
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!cardRef.current || isFlipping) return;

      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const normalizedX = (x - centerX) / centerX;
      const normalizedY = (y - centerY) / centerY;

      const maxTilt = isHovered ? 20 : 12;
      const rotateX = -normalizedY * maxTilt;
      const rotateY = normalizedX * maxTilt;
      const scale = isHovered ? 1.05 : 1.02;

      updateTilt({ rotateX, rotateY, scale });

      // Effetto shine dinamico migliorato
      const shineX = normalizedX * 50 + 50;
      const shineY = normalizedY * 50 + 50;

      const shineOverlay = cardRef.current.querySelector('.shine-overlay');
      if (shineOverlay) {
        shineOverlay.style.background = `
        radial-gradient(
          circle at ${shineX}% ${shineY}%, 
          rgba(255, 255, 255, 0.4) 0%, 
          rgba(255, 255, 255, 0.2) 25%, 
          rgba(108, 99, 255, 0.1) 50%,
          transparent 70%
        )
      `;
        shineOverlay.style.opacity = isHovered ? '0.8' : '0.4';
      }
    },
    [cardRef, isFlipping, isHovered, updateTilt]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    updateTilt({ rotateX: 0, rotateY: 0, scale: 1 });

    if (cardRef.current) {
      const shineOverlay = cardRef.current.querySelector('.shine-overlay');
      if (shineOverlay) {
        shineOverlay.style.opacity = '0';
      }
    }
  }, [cardRef, updateTilt]);

  // Applica le trasformazioni al DOM
  useEffect(() => {
    if (cardRef.current && !isFlipping) {
      cardRef.current.style.transform = `
        perspective(1200px) 
        rotateX(${tiltState.rotateX}deg) 
        rotateY(${tiltState.rotateY}deg) 
        translateZ(${isHovered ? 40 : 20}px)
        scale(${tiltState.scale})
      `;
    }
  }, [tiltState, isHovered, isFlipping, cardRef]);

  return {
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    isHovered,
  };
};

function CardViewer({ card, onClose }) {
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  // Flip con effetti avanzati
  const handleFlip = useCallback(() => {
    if (isFlipping) return;

    setIsFlipping(true);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 20, 50]);
    }

    // Reset smooth delle trasformazioni
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.2s ease-out';
      cardRef.current.style.transform = `
        perspective(1200px) 
        rotateX(0deg) 
        rotateY(0deg) 
        translateZ(0px)
        scale(1.08)
      `;
    }

    setTimeout(() => {
      setShowBack((prev) => !prev);
    }, 200);

    setTimeout(() => {
      setIsFlipping(false);
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        cardRef.current.style.transform = `
          perspective(1200px) 
          rotateX(0deg) 
          rotateY(0deg) 
          translateZ(20px)
          scale(1)
        `;
      }
    }, 600);
  }, [isFlipping]);

  // Hooks personalizzati
  const particles = useParticleSystem(true);
  const { handleMouseMove, handleMouseEnter, handleMouseLeave, isHovered } = useTiltEffect(
    cardRef,
    isFlipping
  );

  // Gestione keyboard avanzata
  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          handleFlip();
          break;
        case 'f':
        case 'F':
          handleFlip();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          handleFlip();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, handleFlip]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) {
        onClose?.();
      }
    },
    [onClose]
  );

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setImageError(true);
  }, []);

  // Memoizza le informazioni della carta per performance
  const cardInfo = useMemo(() => {
    if (!card) return null;

    const processedOracleText = card.oracle_text
      ?.replace(/\n/g, '<br/>')
      .replace(/\{([^}]+)\}/g, '<span class="mana-symbol" data-symbol="$1">[$1]</span>');

    return {
      name: card.name,
      typeLine: card.type_line,
      oracleText: processedOracleText,
      power: card.power,
      toughness: card.toughness,
      loyalty: card.loyalty,
      price: card.prices?.eur
        ? `€ ${card.prices.eur}`
        : card.prices?.usd
          ? `$ ${card.prices.usd}`
          : null,
    };
  }, [card]);

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
      {/* Sistema particelle ottimizzato */}
      <div className="magic-particles" style={{ willChange: 'transform' }}>
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Sfondo animato dinamico */}
      <div className="dynamic-background">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
        <div className="bg-gradient-3"></div>
      </div>

      <div className="card-viewer" onClick={(e) => e.stopPropagation()}>
        {/* Controlli avanzati */}
        <div className="controls-panel">
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Chiudi visualizzatore carta"
            title="Chiudi (Esc)"
          >
            <span className="close-icon">✖</span>
          </button>
        </div>

        <div
          className={`card-container ${showBack ? 'flipped' : ''} ${isFlipping ? 'flipping' : ''} ${isHovered ? 'hovered' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          ref={cardRef}
          role="img"
          aria-label={`Carta Magic: ${card.name}`}
        >
          {/* Overlay shine dinamico migliorato */}
          <div className="shine-overlay" />

          {/* Bordo luminoso reattivo */}
          <div className="glow-border" />

          {/* Effetto olografico */}
          <div className="holographic-overlay" />

          {/* Loading state migliorato */}
          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <span>Evocazione in corso...</span>
            </div>
          )}

          {/* Error state */}
          {imageError && (
            <div className="error-indicator">
              <div className="error-icon">⚠️</div>
              <span>Immagine non disponibile</span>
            </div>
          )}

          <img
            className="card-face front"
            src={card.image_uris?.normal || card.image}
            alt={`Fronte della carta ${card.name}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              opacity: isLoading || imageError ? 0 : 1,
              willChange: 'transform, opacity',
            }}
            loading="eager"
            decoding="async"
          />

          <img
            className="card-face back"
            src="/fr7g5swymhc41.png"
            alt="Retro della carta Magic"
            loading="lazy"
            decoding="async"
            style={{ willChange: 'transform' }}
          />
        </div>

        {/* Controlli flip migliorati */}
        <div className="card-controls">
          <button
            className={`flip-btn ${isFlipping ? 'flipping' : ''}`}
            onClick={handleFlip}
            disabled={isFlipping}
            aria-label={showBack ? 'Mostra fronte carta' : 'Mostra retro carta'}
            title="Gira carta (Spazio/F/Frecce)"
          >
            <span className={`flip-icon ${isFlipping ? 'spinning' : ''}`}>🔄</span>
            <span className="flip-text">
              {isFlipping ? 'Girando...' : showBack ? 'Fronte' : 'Retro'}
            </span>
          </button>

          <div className="quick-info">
            <span className="card-side-indicator">{showBack ? 'Retro' : 'Fronte'}</span>
          </div>
        </div>

        {/* Informazioni carta ottimizzate */}
        <div className="card-info">
          <h3 id="card-title" className="card-title-enhanced">
            {cardInfo.name}
          </h3>

          {cardInfo.typeLine && <p className="type-line enhanced-type">{cardInfo.typeLine}</p>}

          {cardInfo.oracleText && (
            <div
              className="oracle-text enhanced-oracle"
              dangerouslySetInnerHTML={{ __html: cardInfo.oracleText }}
              role="region"
              aria-label="Testo della carta"
            />
          )}

          <div className="stats-grid">
            {cardInfo.power && cardInfo.toughness && (
              <div className="stat-item">
                <span className="stat-label">⚔️</span>
                <span className="stat-value">
                  {cardInfo.power}/{cardInfo.toughness}
                </span>
              </div>
            )}

            {cardInfo.loyalty && (
              <div className="stat-item">
                <span className="stat-label">🛡️</span>
                <span className="stat-value">{cardInfo.loyalty}</span>
              </div>
            )}

            {cardInfo.price && (
              <div className="stat-item price-item">
                <span className="stat-label">💰</span>
                <span className="stat-value">{cardInfo.price}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shortcuts info */}
        <div className="shortcuts-info">
          <small>
            <kbd>Esc</kbd> Chiudi • <kbd>Spazio</kbd>/<kbd>F</kbd> Gira
          </small>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CardViewer;
