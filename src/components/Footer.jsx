import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <span className="coded-by">Coded by Nicco</span>
        <a
          href="https://ko-fi.com/niccob"
          target="_blank"
          rel="noopener noreferrer"
          className="kofi-link"
        >
          Support me on Ko-fi ☕
        </a>
      </div>
    </footer>
  );
}

export default Footer;
