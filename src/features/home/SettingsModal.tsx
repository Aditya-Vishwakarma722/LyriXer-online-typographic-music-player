import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Sparkles, Type, Moon, Check } from 'lucide-react';
import type { UserPreferences, TypographyPreset } from '../../types/session';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

const TYPOGRAPHY_PRESETS: { id: TypographyPreset; label: string; desc: string }[] = [
  { id: 'inter', label: 'Modern Sans', desc: 'Clean, legible neo-grotesque (Inter)' },
  { id: 'geometric', label: 'Geometric', desc: 'Modern high-impact (Plus Jakarta Sans)' },
  { id: 'serif', label: 'Editorial Serif', desc: 'Literary & elegant display' },
  { id: 'mono', label: 'Monospace', desc: 'Technical & structured (JetBrains)' },
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
      title="Preferences & Style"
      description="Customize typography, atmospheric lighting, and display settings."
      maxWidth="560px"
    >
      <div className="settings-modal-content">
        {/* Ambient Halo Pulse Setting */}
        <div className="settings-row">
          <div className="settings-row-label">
            <div className="label-with-icon">
              <Sparkles size={16} className="settings-icon" />
              <span className="settings-title">Ambient Halo Animation</span>
            </div>
            <p className="settings-desc">
              Enable subtle breathing animation on the central hero light halo.
            </p>
          </div>
          <button
            type="button"
            className={`toggle-switch ${preferences.haloMotion ? 'active' : ''}`}
            onClick={() => onUpdatePreferences({ haloMotion: !preferences.haloMotion })}
            aria-label="Toggle ambient halo pulse"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        {/* Typography Preset Selection */}
        <div className="settings-group">
          <div className="label-with-icon mb-2">
            <Type size={16} className="settings-icon" />
            <span className="settings-title">Lyric Typography Preset</span>
          </div>
          <p className="settings-desc mb-3">
            Select the default font rendering for lyrics when playback starts.
          </p>

          <div className="preset-grid">
            {TYPOGRAPHY_PRESETS.map((preset) => {
              const isSelected = preferences.typographyPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onUpdatePreferences({ typographyPreset: preset.id })}
                >
                  <div className="preset-card-header">
                    <span className="preset-label">{preset.label}</span>
                    {isSelected && <Check size={14} className="preset-check" />}
                  </div>
                  <span className="preset-desc">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Preset */}
        <div className="settings-group">
          <div className="label-with-icon mb-2">
            <Moon size={16} className="settings-icon" />
            <span className="settings-title">Color Atmosphere</span>
          </div>
          <div className="theme-options-row">
            {[
              { id: 'midnight', name: 'Charcoal Midnight', color: '#0B0B0D' },
              { id: 'abyss', name: 'Deep Abyss', color: '#08080A' },
              { id: 'obsidian', name: 'Obsidian Violet', color: '#0E0B14' },
            ].map((theme) => {
              const isSelected = preferences.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-chip ${isSelected ? 'active' : ''}`}
                  onClick={() =>
                    onUpdatePreferences({ theme: theme.id as UserPreferences['theme'] })
                  }
                >
                  <span className="theme-dot" style={{ backgroundColor: theme.color }} />
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persistence Note */}
        <div className="settings-note">
          <span>Settings are automatically persisted to local storage for your sessions.</span>
        </div>
      </div>
    </Modal>
  );
};
