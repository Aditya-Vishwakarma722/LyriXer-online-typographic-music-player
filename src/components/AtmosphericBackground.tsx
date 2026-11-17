import React from 'react';
import { HaloBackground } from './HaloBackground';
import { AcousticSoundscapeCanvas } from './AcousticSoundscapeCanvas';
import './AtmosphericBackground.css';

export interface AtmosphericBackgroundProps {
  style?: string;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = React.memo<AtmosphericBackgroundProps>(({
  enablePulse = true,
}) => {
  return (
    <div className="atmospheric-bg-root" aria-hidden="true">
      {/* 1. Deep Obsidian Base Layer */}
      <div className="base-canvas-layer" />

      {/* 2. Authentic Animated Chromatic Sound Nebula / Fluid Aurora Mesh */}
      <div className="aurora-mesh-container">
        <div className="aurora-glow-node node-primary" />
        <div className="aurora-glow-node node-secondary" />
        <div className="aurora-glow-node node-tertiary" />
        <div className="aurora-glow-node node-quaternary" />
      </div>

      {/* 3. Signature Concentric Resonant Halo Rings */}
      <div className="halo-layer">
        <HaloBackground enablePulse={enablePulse} />
      </div>

      {/* 4. Fluid Harmonic Sound Waves & Stardust Audio Particles */}
      <div className="soundscape-canvas-layer">
        <AcousticSoundscapeCanvas />
      </div>

      {/* 5. Deep Obsidian Perimeter Vignette */}
      <div className="atmospheric-vignette" />
    </div>
  );
});

AtmosphericBackground.displayName = 'AtmosphericBackground';
