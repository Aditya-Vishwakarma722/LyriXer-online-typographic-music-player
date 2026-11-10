import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Sparkles } from 'lucide-react';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About LyriXer"
      description="An atmospheric listening sanctuary for music and synchronized lyrics."
      maxWidth="600px"
    >
      <div className="about-modal-content">
        {/* Editorial Narrative / Manifesto */}
        <div className="about-manifesto">
          <div className="about-kicker">
            <Sparkles size={13} className="about-kicker-sparkle" />
            <span>THE LISTENING SANCTUARY</span>
          </div>
          <h3 className="about-lead-title">
            Feel the music. <br />
            <span>See the lyrics.</span>
          </h3>
          <p className="about-lead-body">
            Music videos are the peak of visual storytelling, yet lyrics are often lost to tiny
            subtitles or distracting overlays. LyriXer transforms songs into an immersive cinematic
            experience, turning synchronized lyrics into kinetic typography that breathes with
            every vocal note.
          </p>
        </div>

        {/* Seamless Editorial Pillars — No Boxes */}
        <div className="about-pillars-list">
          <div className="about-pillar-row">
            <span className="about-pillar-num">01</span>
            <div className="about-pillar-body">
              <h4 className="about-pillar-title">Kinetic Vocal Cadence</h4>
              <p className="about-pillar-text">
                Lyrics are strictly locked to the playback timeline with timestamped LRC parsing,
                drifting line-by-line with frame-accurate precision.
              </p>
            </div>
          </div>

          <div className="about-pillar-row">
            <span className="about-pillar-num">02</span>
            <div className="about-pillar-body">
              <h4 className="about-pillar-title">Dual Playback Architecture</h4>
              <p className="about-pillar-text">
                Enjoy seamless official YouTube streaming for online videos, alongside private,
                hardware-accelerated playback for local video files.
              </p>
            </div>
          </div>

          <div className="about-pillar-row">
            <span className="about-pillar-num">03</span>
            <div className="about-pillar-body">
              <h4 className="about-pillar-title">Private by Philosophy</h4>
              <p className="about-pillar-text">
                Your media and playback history live solely within your local browser storage.
                Zero telemetry, zero uploads, and no external tracking.
              </p>
            </div>
          </div>

          <div className="about-pillar-row">
            <span className="about-pillar-num">04</span>
            <div className="about-pillar-body">
              <h4 className="about-pillar-title">Curated Typography & Atmosphere</h4>
              <p className="about-pillar-text">
                Tailored typographic treatments, deep midnight palettes, and subtle visual softening
                curated specifically for late-night music sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Refined Colophon Footer */}
        <div className="about-modal-colophon">
          <div className="about-colophon-left">
            <span className="about-status-dot" />
            <span>LyriXer Core · Crafted for music lovers</span>
          </div>
          <span className="about-colophon-version">v1.0.0</span>
        </div>
      </div>
    </Modal>
  );
};
