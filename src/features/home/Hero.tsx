import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '../../components/ui/Badge';
import { Sparkles } from 'lucide-react';
import './Hero.css';

interface HeroProps {
  children?: React.ReactNode;
}

export const Hero: React.FC<HeroProps> = ({ children }) => {
  return (
    <section className="hero-section" aria-label="Hero Introduction">
      <div className="hero-content">
        {/* Eyebrow Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hero-eyebrow-container"
        >
          <Badge
            variant="violet"
            icon={<Sparkles size={11} className="hero-eyebrow-sparkle" />}
          >
            YOUR MUSIC, YOUR MOMENT
          </Badge>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          className="hero-headline"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          Feel the music. <br className="hero-headline-break" />
          <span className="hero-headline-accent">See the lyrics.</span>
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          className="hero-description"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Your favourite music videos, brought to life through beautifully
          synchronized lyrics and an immersive listening experience.
        </motion.p>

        {/* Interactive Video Input Slot */}
        <motion.div
          className="hero-actions-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};
