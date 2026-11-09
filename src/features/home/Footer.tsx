import React from 'react';
import './Footer.css';

interface FooterProps {
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC<FooterProps> = ({ onOpenAbout, onOpenSettings }) => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-brand">LyriXer</span>
          <span className="footer-separator">•</span>
          <span className="footer-tagline">
            Immersive music-video & synchronized-lyrics platform.
          </span>
        </div>

        <div className="footer-right">
          <button type="button" className="footer-link" onClick={onOpenAbout}>
            About
          </button>
          <button type="button" className="footer-link" onClick={onOpenSettings}>
            Settings
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub
          </a>
          <span className="footer-copyright">
            © {CURRENT_YEAR} LyriXer
          </span>
        </div>
      </div>
    </footer>
  );
};
