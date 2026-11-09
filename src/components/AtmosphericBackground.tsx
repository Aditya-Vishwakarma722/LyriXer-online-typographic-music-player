import React from 'react';
import Waves from './reactbits/Waves';
import Particles from './reactbits/Particles';
import { HaloBackground } from './HaloBackground';
import './AtmosphericBackground.css';

export type BackgroundStyle = 'waves' | 'halo' | 'combined';

interface AtmosphericBackgroundProps {
  style?: BackgroundStyle;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({
  style = 'combined',
  enableParticles = true,
  enablePulse = true,
}) => {
  return (
    <div className="atmospheric-bg-root" aria-hidden="true">
      {/* 1. Deep Near-Black Base Canvas */}
      <div className="base-canvas-layer" />

      {/* 2. Signature Concentric Halo Rings & Violet Ambient Light */}
      {(style === 'halo' || style === 'combined') && (
        <div className="halo-layer">
          <HaloBackground enablePulse={enablePulse} />
        </div>
      )}

      {/* 3. React Bits Waves: Flowing audio silk lines on 100% transparent background */}
      {(style === 'waves' || style === 'combined') && (
        <div className="waves-layer">
          <Waves
            lineColor="rgba(167, 139, 250, 0.15)"
            accentColor="#C4B5FD"
            backgroundColor="transparent"
            lineStyle="solid"
            spacing={18}
            lineWidth={1.2}
            amplitude={24}
            speed={0.4}
            twist={0.8}
            mouseInteraction={true}
            mouseRadius={180}
            mouseStrength={0.6}
            clickRipple={true}
            opacity={0.85}
            className="waves-instance"
          />
        </div>
      )}

      {/* 4. React Bits Floating Audio / Stardust Particles */}
      {enableParticles && (
        <div className="particles-layer">
          <Particles
            particleCount={35}
            particleSpread={12}
            speed={0.12}
            particleColors={['#A78BFA', '#C4B5FD', '#FFFFFF']}
            particleBaseSize={80}
            sizeRandomness={0.7}
            cameraDistance={20}
            shape="circle"
            glow={0.35}
            twinkle={0.3}
            hoverEffect="repel"
            hoverRadius={120}
            moveParticlesOnHover={true}
            drift="up"
            driftSpeed={0.12}
            opacity={0.45}
            className="particles-instance"
          />
        </div>
      )}

      {/* 5. Pure Deep Vignette Falloff to ensure zero grey and maximum legibility */}
      <div className="atmospheric-vignette" />
    </div>
  );
};
