import React from 'react';
import { motion } from 'motion/react';
import './HaloBackground.css';

interface HaloBackgroundProps {
  enablePulse?: boolean;
}

export const HaloBackground: React.FC<HaloBackgroundProps> = ({ enablePulse = true }) => {
  return (
    <div className="halo-container" aria-hidden="true">
      {/* Central Ambient Glow */}
      <motion.div
        className="halo-core-glow"
        animate={
          enablePulse
            ? {
                scale: [1, 1.04, 1],
                opacity: [0.85, 1, 0.85],
              }
            : undefined
        }
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Atmospheric Concentric Halo Rings */}
      <motion.div
        className="halo-rings-wrapper"
        animate={
          enablePulse
            ? {
                scale: [1, 1.025, 1],
              }
            : undefined
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          className="halo-svg"
          viewBox="0 0 1000 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Laser Cyan Radial Gradient for Ring 1 */}
            <radialGradient id="ringGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.10" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#050608" stopOpacity="0" />
            </radialGradient>

            {/* Linear Gradient for Inner Ring Stroke */}
            <linearGradient id="strokeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#050608" stopOpacity="0.01" />
            </linearGradient>

            {/* Linear Gradient for Middle Ring Stroke */}
            <linearGradient id="strokeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#050608" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Innermost ring */}
          <circle
            cx="500"
            cy="500"
            r="160"
            stroke="url(#strokeGrad1)"
            strokeWidth="1.1"
            strokeDasharray="4 8"
            opacity="0.45"
          />

          {/* Inner Accent Ring */}
          <circle
            cx="500"
            cy="500"
            r="230"
            stroke="url(#strokeGrad1)"
            strokeWidth="1.2"
            opacity="0.5"
          />

          {/* Middle Concentric Ring */}
          <circle
            cx="500"
            cy="500"
            r="320"
            stroke="url(#strokeGrad2)"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Middle Outer Dashed Ring */}
          <circle
            cx="500"
            cy="500"
            r="400"
            stroke="url(#strokeGrad2)"
            strokeWidth="0.9"
            strokeDasharray="6 12"
            opacity="0.3"
          />

          {/* Outer Horizon Ring */}
          <circle
            cx="500"
            cy="500"
            r="480"
            stroke="url(#strokeGrad2)"
            strokeWidth="0.8"
            opacity="0.2"
          />
        </svg>
      </motion.div>
    </div>
  );
};

