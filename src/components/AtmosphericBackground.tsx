import React from 'react';
import DarkVeil from './reactbits/DarkVeil';
import Aurora from './reactbits/Aurora';
import Particles from './reactbits/Particles';
import { HaloBackground } from './HaloBackground';
import './AtmosphericBackground.css';

export type BackgroundStyle = 'dark-veil' | 'aurora' | 'halo';

interface AtmosphericBackgroundProps {
  style?: BackgroundStyle;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({
  style = 'dark-veil',
  enableParticles = true,
  enablePulse = true,
}) => {
  return (
    <div className="atmospheric-bg-root" aria-hidden="true">
      {/* 1. Underlying Shader Layer (DarkVeil or Aurora from React Bits) */}
      <div className="shader-layer">
        {style === 'dark-veil' && (
          <DarkVeil
            color="#8B5CF6"
            speed={0.5}
            flow={1.1}
            warp={1.3}
            sheen={0.75}
            glow={0.5}
            grain={0.14}
            brightness={0.4}
            opacity={0.55}
            mouseInteraction={true}
            mouseStrength={1.2}
            className="shader-instance"
          />
        )}

        {style === 'aurora' && (
          <Aurora
            colorStops={['#7C3AED', '#A78BFA', '#3B82F6', '#8B5CF6']}
            speed={0.4}
            amplitude={1.1}
            blend={0.6}
            glow={0.5}
            brightness={0.45}
            opacity={0.5}
            direction="top"
            mouseInteraction={true}
            className="shader-instance"
          />
        )}
      </div>

      {/* 2. Signature Concentric Halo Rings */}
      <div className="halo-layer">
        <HaloBackground enablePulse={enablePulse} />
      </div>

      {/* 3. Subtle Floating Audio/Stardust Particles from React Bits */}
      {enableParticles && (
        <div className="particles-layer">
          <Particles
            particleCount={30}
            particleSpread={12}
            speed={0.12}
            particleColors={['#A78BFA', '#C4B5FD', '#DDD6FE', '#FFFFFF']}
            particleBaseSize={90}
            sizeRandomness={0.7}
            cameraDistance={22}
            shape="circle"
            glow={0.4}
            twinkle={0.35}
            hoverEffect="repel"
            hoverRadius={140}
            moveParticlesOnHover={true}
            drift="up"
            driftSpeed={0.1}
            opacity={0.4}
            className="particles-instance"
          />
        </div>
      )}

      {/* 4. Film Grain & Radial Vignette Overlay to ensure text readability */}
      <div className="atmospheric-vignette" />
    </div>
  );
};
