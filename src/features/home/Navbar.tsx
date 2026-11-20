import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Info, Mic2, Home, Radio } from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';
import './Navbar.css';

interface NavbarProps {
  onOpenAbout: () => void;
  onOpenSettings: () => void;
  onOpenArtists?: () => void;
  onOpenHome?: () => void;
  activeView?: 'home' | 'artists';
}

export const Navbar: React.FC<NavbarProps> = React.memo<NavbarProps>(({
  onOpenAbout,
  onOpenSettings,
  onOpenArtists,
  onOpenHome,
  activeView = 'home',
}) => {
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
        {/* Redesigned Cybernetic LyriXer Brandmark */}
        <div className="navbar-brand-wrap">
          <BrandLogo
            size="md"
            onClick={onOpenHome}
            showBadge={true}
            badgeText="SPATIAL_V2"
            className="navbar-brand-interactive"
          />
        </div>

        {/* Center Live Acoustic Engine Beacon */}
        <div className="navbar-center-beacon" aria-hidden="true">
          <div className="beacon-chip">
            <span className="beacon-indicator-dot" />
            <Radio size={12} className="beacon-radio-icon" />
            <span className="beacon-chip-label">24-BIT / 96kHz SPATIAL AUDIO</span>
            <div className="beacon-mini-eq">
              <span className="eq-bar bar-1" />
              <span className="eq-bar bar-2" />
              <span className="eq-bar bar-3" />
            </div>
          </div>
        </div>

        {/* Elevated Navigation Controls */}
        <nav className="navbar-nav" aria-label="Main Navigation">
          {onOpenHome && activeView === 'artists' && (
            <button
              type="button"
              className="navbar-link"
              onClick={onOpenHome}
              aria-label="Home"
            >
              <Home size={14} className="navbar-link-icon" />
              <span>Home</span>
            </button>
          )}

          {onOpenArtists && (
            <button
              type="button"
              className={`navbar-link ${activeView === 'artists' ? 'active' : ''}`}
              onClick={onOpenArtists}
              aria-label="Artists Catalogue"
            >
              <Mic2 size={14} className="navbar-link-icon" />
              <span>Artists</span>
            </button>
          )}

          <button
            type="button"
            className="navbar-link"
            onClick={onOpenAbout}
            aria-label="About LyriXer"
          >
            <Info size={14} className="navbar-link-icon" />
            <span>About</span>
          </button>

          <button
            type="button"
            className="navbar-link"
            onClick={onOpenSettings}
            aria-label="Application Settings"
          >
            <SlidersHorizontal size={14} className="navbar-link-icon" />
            <span>Settings</span>
          </button>
        </nav>
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';
