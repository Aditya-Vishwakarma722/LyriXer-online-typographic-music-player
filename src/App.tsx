import React, { useState, useEffect } from 'react';
import { HaloBackground } from './components/HaloBackground';
import { Navbar } from './features/home/Navbar';
import { Hero } from './features/home/Hero';
import { VideoInput } from './features/home/VideoInput';
import { RecentSessions } from './features/home/RecentSessions';
import { Footer } from './features/home/Footer';
import { AboutModal } from './features/home/AboutModal';
import { SettingsModal } from './features/home/SettingsModal';
import { PlayerShell } from './features/player/PlayerShell';
import type { UserPreferences, VideoSource, RecentSession } from './types/session';
import './App.css';

const DEFAULT_PREFERENCES: UserPreferences = {
  typographyPreset: 'inter',
  fontSize: 1,
  haloMotion: true,
  theme: 'midnight',
  blurLevel: 8,
  overlayOpacity: 0.5,
};

const STORAGE_KEY_RECENT = 'lyrixer_recent_sessions';

export const App: React.FC = () => {
  // User Preferences with LocalStorage Persistence (FR-10)
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem('lyrixer_preferences');
      return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  // Recent Sessions State
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
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

    // Record to recent sessions
    const newSession: RecentSession = {
      id: `session-${Date.now()}`,
      title: source.title,
      artist: source.kind === 'youtube' ? 'YouTube Music' : 'Local Video',
      thumbnailUrl: source.thumbnailUrl,
      kind: source.kind,
      sourceId: source.sourceId,
      duration: source.duration,
      playedAt: new Date().toISOString(),
    };

    setRecentSessions((prev) => {
      const filtered = prev.filter((s) => s.sourceId !== source.sourceId);
      const updated = [newSession, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleExitPlayer = () => {
    setActiveSession(null);
  };

  return (
    <div className={`app-shell theme-${preferences.theme}`}>
      {/* Active Session: Full Immersion Player View */}
      {activeSession ? (
        <PlayerShell
          source={activeSession}
          preferences={preferences}
          onExit={handleExitPlayer}
          onUpdatePreferences={handleUpdatePreferences}
        />
      ) : (
        /* Default: Clean Homepage UI */
        <>
          {/* Ambient Halo concentric lighting */}
          <HaloBackground enablePulse={preferences.haloMotion} />

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
            <RecentSessions
              sessions={recentSessions}
              onSelectSession={handleStartSession}
            />
          </main>

          {/* Minimal Footer */}
          <Footer
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </>
      )}

      {/* Dialog Modals */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    </div>
  );
};

export default App;
