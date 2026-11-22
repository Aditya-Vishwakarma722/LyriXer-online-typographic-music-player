import React from 'react';
import Threads from './reactbits/Threads';
import { HaloBackground } from './HaloBackground';
import { AcousticSoundscapeCanvas } from './AcousticSoundscapeCanvas';
import './AtmosphericBackground.css';

export interface AtmosphericBackgroundProps {
  style?: string;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = React.memo<AtmosphericBackgroundProps>(({
  enableParticles = true,
  enablePulse = true,
}) => {
  return (
    <div className="atmospheric-bg-root" aria-hidden="true">
      {/* 1. Deep Obsidian Base Layer (Guaranteed Zero Grey / Full Contrast) */}
      <div className="base-canvas-layer" />

      {/* 2. Cybernetic Sound Nebula / Ambient Chromatic Aurora Light */}
      <div className="aurora-mesh-container">
        <div className="aurora-glow-node node-primary" />
        <div className="aurora-glow-node node-secondary" />
        <div className="aurora-glow-node node-tertiary" />
      </div>

      {/* 3. Signature Concentric Resonant Halo Rings */}
      <div className="halo-layer">
        <HaloBackground enablePulse={enablePulse} />
      </div>

      {/* 4. React Bits Threads: High-Tech Waveform Strings & Acoustic Resonance */}
      <div className="threads-layer">
        <Threads
          color="#00F2FE"
          accentColor="#8B5CF6"
          amplitude={1.35}
          distance={0.32}
          enableMouseInteraction={true}
          lineCount={64}
          thickness={0.9}
          softness={1.2}
          speed={0.42}
          waves={1.5}
          split={0.04}
          fray={0.45}
          angle={22}
          parting={0.38}
          brightness={1.3}
          opacity={0.7}
        />
      </div>

      {/* 5. Harmonic Stardust Audio Particles */}
      {enableParticles && (
        <div className="soundscape-canvas-layer">
          <AcousticSoundscapeCanvas />
        </div>
      )}

      {/* 6. Deep Obsidian Perimeter Vignette for Crisp Contrast */}
      <div className="atmospheric-vignette" />
    </div>
  );
});

AtmosphericBackground.displayName = 'AtmosphericBackground';
