import React, { useState, useEffect } from 'react';
import { AtmosphericBackground } from './components/AtmosphericBackground';
import { Navbar } from './features/home/Navbar';
import { Hero } from './features/home/Hero';
import { VideoInput } from './features/home/VideoInput';
import { RecentSessions } from './features/home/RecentSessions';
import { Footer } from './features/home/Footer';
import { AboutModal } from './features/home/AboutModal';
import { SettingsModal } from './features/home/SettingsModal';
import { SessionLaunchModal } from './features/home/SessionLaunchModal';
import type { UserPreferences, VideoSource } from './types/session';
import './App.css';

const DEFAULT_PREFERENCES: UserPreferences = {
  typographyPreset: 'inter',
  fontSize: 1,
  haloMotion: true,
  backgroundStyle: 'combined',
  enableParticles: true,
  theme: 'midnight',
  blurLevel: 8,
  overlayOpacity: 0.5,
};

export const App: React.FC = () => {
  // User Preferences with LocalStorage Persistence (FR-10)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem('lyrixer_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.backgroundStyle === 'dark-veil' || parsed.backgroundStyle === 'aurora') {
          parsed.backgroundStyle = 'combined';
        }
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
      return DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Modal Dialog States
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<VideoSource | null>(null);

  // Synchronize preferences to localStorage and DOM theme
  const handleUpdatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('lyrixer_preferences', JSON.stringify(updated));
      } catch {
        // Storage quota / privacy mode fallback
      }
      return updated;
    });
  };

  useEffect(() => {
    // Apply theme dynamic tokens if customized
    const root = document.documentElement;
    if (preferences.theme === 'abyss') {
      root.style.setProperty('--bg-base', '#060608');
    } else if (preferences.theme === 'obsidian') {
      root.style.setProperty('--bg-base', '#0E0B14');
    } else {
      root.style.setProperty('--bg-base', '#0B0B0D');
    }
  }, [preferences.theme]);

  const handleStartSession = (source: VideoSource) => {
    setActiveSession(source);
  };

  return (
    <div className={`app-shell theme-${preferences.theme}`}>
      {/* Authentic Classy Atmospheric Background (React Bits DarkVeil / Aurora + Particles + Halo) */}
      <AtmosphericBackground
        style={preferences.backgroundStyle}
        enableParticles={preferences.enableParticles}
        enablePulse={preferences.haloMotion}
      />

      {/* Sparse Navigation */}
      <Navbar
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Page Layout */}
      <main className="main-viewport">
        {/* Centered Hero & Video Input */}
        <Hero>
          <VideoInput onStartSession={handleStartSession} />
        </Hero>

        {/* Quiet Recently Played Area */}
        <RecentSessions onSelectSession={handleStartSession} />
      </main>

      {/* Minimal Footer */}
      <Footer
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Dialog Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      <SessionLaunchModal
        session={activeSession}
        onClose={() => setActiveSession(null)}
      />
    </div>
  );
};

export default App;
