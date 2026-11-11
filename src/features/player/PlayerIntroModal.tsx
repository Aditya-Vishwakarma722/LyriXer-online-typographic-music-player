import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Sparkles, Play, Search, Keyboard } from 'lucide-react';
import './PlayerIntroModal.css';

interface PlayerIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  trackTitle?: string;
  trackArtist?: string;
}

export const PlayerIntroModal: React.FC<PlayerIntroModalProps> = ({
  isOpen,
  onClose,
  onStart,
  trackTitle,
  trackArtist,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleStartPlaying = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('lyrixer_hide_player_intro', 'true');
      } catch {
        // ignore
      }
    }
    onStart();
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('lyrixer_hide_player_intro', 'true');
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="How Lyric Sync Works"
      description="Essential guide to synchronizing lyrics with any music video."
      maxWidth="620px"
    >
      <div className="player-intro-content">
        {/* Header Hero Narrative */}
        <div className="player-intro-manifesto">
          <div className="player-intro-kicker">
            <Sparkles size={13} className="player-intro-kicker-sparkle" />
            <span>QUICK START GUIDE &middot; LYRICS SYNCHRONIZATION</span>
          </div>
          <h3 className="player-intro-lead-title">
            Feel the music. <br />
            <span>Master the lyrics sync.</span>
          </h3>
          {trackTitle && (
            <div className="player-intro-current-track">
              <span className="intro-track-label">Preparing track:</span>
              <strong className="intro-track-name">{trackTitle}</strong>
              {trackArtist && <span className="intro-track-by">&middot; {trackArtist}</span>}
            </div>
          )}
          <p className="player-intro-lead-body">
            Official music videos frequently include cinematic opening dialogue, skits, or instrumental
            preambles. Here is how to keep lyrics synchronized with frame-accurate precision:
          </p>
        </div>

        {/* Editorial Guide Pillars — Seamless Authentic Aesthetic */}
        <div className="player-intro-pillars">
          {/* Step 1: Adjust for Video Intros */}
          <div className="player-intro-pillar">
            <span className="player-intro-pillar-num">01</span>
            <div className="player-intro-pillar-body">
              <div className="player-intro-pillar-header">
                <h4 className="player-intro-pillar-title">How to Adjust Video Intros</h4>
                <div className="intro-key-badge">
                  <kbd className="intro-kbd">S</kbd>
                  <span>key</span>
                </div>
              </div>
              <p className="player-intro-pillar-text">
                When the singer sings the very first word, press <kbd className="intro-kbd-inline">S</kbd> on
                your keyboard or click <strong>"Sync to Vocal Start"</strong> in the bottom bar.
                This instantly locks the entire lyrics timeline to the video.
              </p>
            </div>
          </div>

          {/* Step 2: Fine Adjust with Brackets */}
          <div className="player-intro-pillar">
            <span className="player-intro-pillar-num">02</span>
            <div className="player-intro-pillar-body">
              <div className="player-intro-pillar-header">
                <h4 className="player-intro-pillar-title">Fine-Tune Sync (Delay &amp; Rush)</h4>
                <div className="intro-key-badge">
                  <kbd className="intro-kbd">[</kbd>
                  <kbd className="intro-kbd">]</kbd>
                </div>
              </div>
              <p className="player-intro-pillar-text">
                Need micro-timing adjustments? Use <kbd className="intro-kbd-inline">[</kbd> to <strong>Rush</strong> lyrics
                earlier, or <kbd className="intro-kbd-inline">]</kbd> to <strong>Delay</strong> lyrics later.
                You can also use the <strong>Fine Adjust (-1s to +1s)</strong> steppers in the bottom player bar.
              </p>
            </div>
          </div>

          {/* Step 3: If lyrics don't match */}
          <div className="player-intro-pillar">
            <span className="player-intro-pillar-num">03</span>
            <div className="player-intro-pillar-body">
              <div className="player-intro-pillar-header">
                <h4 className="player-intro-pillar-title">If Lyrics Don't Match</h4>
                <div className="intro-pill-badge">
                  <Search size={11} />
                  <span>Search LRCLIB</span>
                </div>
              </div>
              <p className="player-intro-pillar-text">
                If the song is a remix, live version, or the lyrics don't match, click the{' '}
                <strong>"Search LRCLIB"</strong> option in the top bar to choose from thousands of community-synced
                tracks or upload your own <strong>.lrc</strong> file.
              </p>
            </div>
          </div>

          {/* Step 4: Quick Shortcuts */}
          <div className="player-intro-pillar">
            <span className="player-intro-pillar-num">04</span>
            <div className="player-intro-pillar-body">
              <div className="player-intro-pillar-header">
                <h4 className="player-intro-pillar-title">Essential Player Shortcuts</h4>
                <div className="intro-key-badge">
                  <Keyboard size={12} />
                  <span>Shortcuts</span>
                </div>
              </div>
              <p className="player-intro-pillar-text">
                <kbd className="intro-kbd-inline">Space</kbd> Play / Pause &middot;{' '}
                <kbd className="intro-kbd-inline">&larr;</kbd> <kbd className="intro-kbd-inline">&rarr;</kbd> Seek &plusmn;5s &middot;{' '}
                <kbd className="intro-kbd-inline">F</kbd> Fullscreen &middot;{' '}
                <kbd className="intro-kbd-inline">L</kbd> Toggle Lyrics
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="player-intro-footer">
          <label className="player-intro-dont-show">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="player-intro-checkbox"
            />
            <span>Don't show this intro automatically again</span>
          </label>

          <Button
            variant="primary"
            size="md"
            onClick={handleStartPlaying}
            leftIcon={<Play size={15} fill="currentColor" />}
            className="player-intro-start-btn"
          >
            Start Watching
          </Button>
        </div>
      </div>
    </Modal>
  );
};
