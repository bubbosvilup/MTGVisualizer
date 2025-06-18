// StartupModal.jsx
import React, { useState, useEffect } from 'react';
import '../styles/StartupModal.css';

const steps = [
  { label: 'Inizializzazione sistema...', icon: '⚡' },
  { label: 'Caricamento collezione...', icon: '🗃️' },
  { label: 'Analisi dati...', icon: '🔄' },
  { label: 'Caricamento mazzi...', icon: '🃏' },
  { label: 'Sistema pronto!', icon: '✅' },
];

const ProgressBar = ({ progress }) => (
  <div className="progress-container">
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
    </div>
    <div className="progress-text">{Math.round(progress)}%</div>
  </div>
);

const LoadingDots = () => (
  <div className="loading-dots">
    <span></span>
    <span></span>
    <span></span>
  </div>
);

const StartupModal = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    const showModal = () => setIsVisible(true);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(showModal, 300));
    } else {
      setTimeout(showModal, 300);
    }
    return () => document.removeEventListener('DOMContentLoaded', showModal);
  }, []);

  useEffect(() => {
    if (!isVisible || isHiding) return;
    if (currentStep < steps.length - 1) {
      const t = setTimeout(() => setCurrentStep((s) => s + 1), 2000);
      return () => clearTimeout(t);
    } else {
      // Dopo l'ultimo step, chiudi il modale
      const t1 = setTimeout(() => {
        setIsHiding(true);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onComplete?.();
          }, 100);
        }, 400);
      }, 2000);
      return () => clearTimeout(t1);
    }
  }, [currentStep, isVisible, isHiding, onComplete]);

  const progress = Math.min(((currentStep + 1) / steps.length) * 100, 100);

  return (
    <div
      className={`startup-modal-overlay ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''}`}
      style={{ display: 'flex' }}
    >
      <div className={`startup-modal ${isHiding ? 'hiding' : ''}`}>
        <div className="startup-header">
          <h1>MTG Visualizer</h1>
          <p>Preparazione dell'ambiente...</p>
        </div>
        <div className="startup-content">
          <div className="loading-steps">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className={`loading-step ${
                  idx < currentStep ? 'completed' : idx === currentStep ? 'active' : 'pending'
                }`}
              >
                <div className="step-icon">{idx < currentStep ? '✓' : step.icon}</div>
                <div className="step-label">{step.label}</div>
                {idx === currentStep && idx !== steps.length - 1 && (
                  <div className="step-spinner">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <ProgressBar progress={progress} />
        </div>
        <div className="startup-footer">
          <LoadingDots />
        </div>
      </div>
    </div>
  );
};

export default StartupModal;
