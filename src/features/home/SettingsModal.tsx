import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Type, Moon, Sparkles } from 'lucide-react';
import type { UserPreferences, TypographyPreset } from '../../types/session';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

const TYPOGRAPHY_PRESETS: { id: TypographyPreset; label: string; desc: string; sample: string }[] = [
  { id: 'kinetic', label: 'Kinetic Screen', desc: 'Screen-filling kinetic typography (Anime / Cinema Edit)', sample: 'Aa' },
  { id: 'focus-stack', label: 'Focus Stack', desc: 'Active line in focus with softened surrounding context', sample: 'Aa' },
  { id: 'inter', label: 'Modern Sans', desc: 'Clean, legible neo-grotesque (Inter)', sample: 'Aa' },
  { id: 'geometric', label: 'Geometric', desc: 'Modern high-impact display (Plus Jakarta Sans)', sample: 'Aa' },
  { id: 'serif', label: 'Editorial Serif', desc: 'Literary & elegant display', sample: 'Aa' },
  { id: 'mono', label: 'Monospace', desc: 'Technical & structured (JetBrains Mono)', sample: 'Aa' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Preferences & Atmosphere"
      description="Refine your typographic styling, lyric engine, and aesthetic palette."
      maxWidth="580px"
    >
      <div className="settings-modal-content">
        {/* Section 1: Typography Presets — Fluid Editorial List (No Boxes) */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Type size={14} className="settings-section-icon" />
            <span className="settings-section-title">Lyric Typography Preset</span>
          </div>
          <p className="settings-section-desc">
            Choose the typographic treatment for lyric rendering during playback.
          </p>

          <div className="settings-typo-list">
            {TYPOGRAPHY_PRESETS.map((preset) => {
              const isSelected = preferences.typographyPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`settings-typo-row ${isSelected ? 'active' : ''}`}
                  onClick={() => onUpdatePreferences({ typographyPreset: preset.id })}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onUpdatePreferences({ typographyPreset: preset.id });
                    }
                  }}
                >
                  <div className="typo-row-left">
                    <div className="typo-radio-pip-wrapper">
                      <span className={`typo-radio-pip ${isSelected ? 'active' : ''}`} />
                    </div>
                    <div className="typo-row-text">
                      <span className="typo-row-label">{preset.label}</span>
                      <span className="typo-row-desc">{preset.desc}</span>
                    </div>
                  </div>
                  <span className={`typo-sample-pill preset-font-${preset.id}`}>
                    {preset.sample}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Background Blur Softening */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Sparkles size={14} className="settings-section-icon" />
            <span className="settings-section-title">Background Softening</span>
          </div>
          <p className="settings-section-desc">
            Balance visual backdrop fidelity against foreground lyric readability.
          </p>

          <div className="settings-blur-row">
            {[
              { level: 4, label: 'Subtle', desc: '4px' },
              { level: 8, label: 'Balanced', desc: '8px' },
              { level: 14, label: 'Deep', desc: '14px' },
            ].map((opt) => {
              const isSelected = (preferences.blurLevel || 8) === opt.level;
              return (
                <button
                  key={opt.level}
                  type="button"
                  className={`blur-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => onUpdatePreferences({ blurLevel: opt.level })}
                >
                  <span className="blur-pill-label">{opt.label}</span>
                  <span className="blur-pill-desc">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Color Palette Atmosphere */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Moon size={14} className="settings-section-icon" />
            <span className="settings-section-title">Color Atmosphere</span>
          </div>
          <p className="settings-section-desc">
            Deep nocturnal base tones calibrated for late-night music sessions.
          </p>

          <div className="settings-theme-row">
            {[
              { id: 'midnight', name: 'Charcoal Midnight', color: '#0B0B0D', accent: '#A78BFA' },
              { id: 'abyss', name: 'Deep Abyss', color: '#060608', accent: '#60A5FA' },
              { id: 'obsidian', name: 'Obsidian Violet', color: '#0E0B14', accent: '#C084FC' },
            ].map((theme) => {
              const isSelected = preferences.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-swatch-btn ${isSelected ? 'active' : ''}`}
                  onClick={() =>
                    onUpdatePreferences({ theme: theme.id as UserPreferences['theme'] })
                  }
                >
                  <span
                    className="theme-swatch-circle"
                    style={{ backgroundColor: theme.color }}
                  >
                    {isSelected && (
                      <span
                        className="theme-swatch-pip"
                        style={{ backgroundColor: theme.accent }}
                      />
                    )}
                  </span>
                  <span className="theme-swatch-name">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persistence Note */}
        <div className="settings-colophon">
          <span className="settings-colophon-dot" />
          <span>Preferences are automatically preserved across your sessions</span>
        </div>
      </div>
    </Modal>
  );
};
