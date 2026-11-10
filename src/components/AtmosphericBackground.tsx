import React from 'react';
import heroBgImage from '../assets/hero-bg.jpg';
import './AtmosphericBackground.css';

export interface AtmosphericBackgroundProps {
  style?: string;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = () => {
  return (
    <div className="atmospheric-bg-root" aria-hidden="true">
      <img
        src={heroBgImage}
        alt=""
        className="atmospheric-bg-image"
        loading="eager"
      />
      <div className="atmospheric-bg-overlay" />
    </div>
  );
};
