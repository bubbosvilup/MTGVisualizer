import React, { useState } from 'react';
import '../styles/CollapsibleSection.css';

function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`collapsible-section ${isOpen ? 'open' : ''}`}>
      <button className="collapsible-header" onClick={toggleOpen}>
        <h3>{title}</h3>
        <span className="collapsible-icon">{isOpen ? '▼' : '▶'}</span>
      </button>
      <div className="collapsible-content">
        <div className="collapsible-content-inner">{children}</div>
      </div>
    </div>
  );
}

export default CollapsibleSection;
