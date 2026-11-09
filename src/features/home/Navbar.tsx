import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Info } from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  onOpenAbout: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAbout, onOpenSettings }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-container ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-content">
        {/* Brand Wordmark */}
        <a href="/" className="navbar-brand" aria-label="LyriXer Home">
          <div className="navbar-logo-glyph">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1.2" />
              <path
                d="M6 12h2c.8 0 1.2-4 2.4-4s1.6 8 2.8 8 1.6-6 2.4-6 1.2 3 2 3h2.4"
                stroke="#A78BFA"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="1.8" fill="#F5F5F5" />
            </svg>
          </div>
          <span className="navbar-wordmark">LyriXer</span>
        </a>

        {/* Minimal Navigation */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          <button
            type="button"
            className="navbar-link"
            onClick={onOpenAbout}
            aria-label="About LyriXer"
          >
            <Info size={15} className="navbar-link-icon" />
            <span>About</span>
          </button>

          <button
            type="button"
            className="navbar-link"
            onClick={onOpenSettings}
            aria-label="Application Settings"
          >
            <SlidersHorizontal size={15} className="navbar-link-icon" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
