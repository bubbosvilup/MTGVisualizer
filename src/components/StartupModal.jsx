// StartupModal.jsx
import React, { useState, useEffect } from 'react';
import '../styles/StartupModal.css';

const steps = ['1', '2', '3', '4', '5'];

const StartupModal = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

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
    if (!isVisible) {
      setShowDonation(false);
      return;
    }
    const t = setTimeout(() => setShowDonation(true), 4000);
    return () => clearTimeout(t);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || isHiding) return;
    if (currentStep < steps.length - 1) {
      const t = setTimeout(() => setCurrentStep((s) => s + 1), 1500);
      return () => clearTimeout(t);
    } else {
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

  return (
    <div
      className={`startup-modal-overlay ${isVisible ? 'visible' : ''} ${isHiding ? 'hiding' : ''}`}
    >
      <div className="startup-modal">
        <div className="spinner" />
        <h1>MTG Visualizer</h1>
        <p>Caricamento in corso...</p>
        {showDonation && (
          <p className={`donation-message ${isVisible ? 'visible' : ''}`}>
            Sviluppato da Nicco –{' '}
            <a href="https://ko-fi.com/niccob" target="_blank" rel="noopener noreferrer">
              Se ti và puoi offrirmi un caffè su ko-fi ☕
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default StartupModal;
