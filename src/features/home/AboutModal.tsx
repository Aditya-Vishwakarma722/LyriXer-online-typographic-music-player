import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { ShieldCheck, Video, Music, Layers } from 'lucide-react';
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
      description="A minimal, immersive music-video and synchronized-lyrics experience."
      maxWidth="580px"
    >
      <div className="about-modal-content">
        <div className="about-feature-card">
          <div className="about-icon-box">
            <Video size={18} />
          </div>
          <div className="about-text-box">
            <h4>Dual Playback Architecture</h4>
            <p>
              LyriXer provides two dedicated experiences: a compliant, official YouTube IFrame
              Player integration for online music videos, and an atmospheric, full-viewport
              background blur player for local files.
            </p>
          </div>
        </div>

        <div className="about-feature-card">
          <div className="about-icon-box">
            <Music size={18} />
          </div>
          <div className="about-text-box">
            <h4>Clock-of-Truth Synchronization</h4>
            <p>
              Lyrics are strictly locked to the playback timeline using timestamped LRC parsing,
              ensuring smooth, drift-free subtitle and lyric highlighting during seeking and pauses.
            </p>
          </div>
        </div>

        <div className="about-feature-card">
          <div className="about-icon-box">
            <Layers size={18} />
          </div>
          <div className="about-text-box">
            <h4>Refined Typography Presets</h4>
            <p>
              Switch between curated typographic treatments: modern sans, editorial serif,
              geometric, and condensed styles tailored for maximum readability over motion.
            </p>
          </div>
        </div>

        <div className="about-feature-card">
          <div className="about-icon-box">
            <ShieldCheck size={18} />
          </div>
          <div className="about-text-box">
            <h4>Privacy & Local Media</h4>
            <p>
              Local video files remain entirely within your browser session and are never uploaded
              to remote servers or shared.
            </p>
          </div>
        </div>

        <div className="about-modal-footer">
          <span className="about-version">LyriXer v0.1.0 • Phase 1 UI Foundation</span>
          <span className="about-status-badge">Phase 1 Foundation Active</span>
        </div>
      </div>
    </Modal>
  );
};
