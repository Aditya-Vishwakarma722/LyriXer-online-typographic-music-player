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
import { ArtistPage } from './features/artist/ArtistPage';
import type { UserPreferences, VideoSource, RecentSession } from './types/session';
import type { ArtistTrack } from './types/artist';
import { ArrowRight } from 'lucide-react';
import './App.css';

const DEFAULT_PREFERENCES: UserPreferences = {
  typographyPreset: 'kinetic',
  fontSize: 1,
  haloMotion: true,
  theme: 'midnight',
  blurLevel: 8,
  overlayOpacity: 0.5,
};

const STORAGE_KEY_RECENT = 'lyrixer_recent_sessions';

type AppView = 'home' | 'artist' | 'player';

export const App: React.FC = () => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedArtistId, setSelectedArtistId] = useState<string>('coldplay');
  const [previousView, setPreviousView] = useState<'home' | 'artist'>('home');

  // User Preferences with LocalStorage Persistence
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
    setCurrentView('player');

    // Record to recent sessions
    const newSession: RecentSession = {
      id: `session-${Date.now()}`,
      title: source.title,
      artist: source.artist || (source.kind === 'youtube' ? 'YouTube Music' : 'Local Video'),
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

  const handleSelectArtistTrack = (track: ArtistTrack) => {
    setPreviousView('artist');
    const source: VideoSource = {
      kind: 'youtube',
      sourceId: track.videoId,
      title: track.title,
      artist: track.artist,
      thumbnailUrl: track.thumbnailUrl,
      duration: track.duration,
    };
    handleStartSession(source);
  };

  const handleOpenArtist = (artistName?: string) => {
    if (artistName) {
      const cleanId = artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
      setSelectedArtistId(cleanId || 'coldplay');
    }
    setCurrentView('artist');
  };

  const handleExitPlayer = () => {
    setCurrentView(previousView);
  };

  return (
    <div className={`app-shell theme-${preferences.theme}`}>
      {/* View 1: Immersive Player View */}
      {currentView === 'player' && activeSession ? (
        <PlayerShell
          source={activeSession}
          preferences={preferences}
          onExit={handleExitPlayer}
          onUpdatePreferences={handleUpdatePreferences}
          onOpenArtist={handleOpenArtist}
        />
      ) : currentView === 'artist' ? (
        /* View 2: Full-Screen Cinematic Editorial Artist Profile Page */
        <ArtistPage
          initialArtistId={selectedArtistId}
          activeSession={activeSession}
          onSelectTrack={handleSelectArtistTrack}
          onBackToHome={() => setCurrentView('home')}
          onOpenPlayer={() => setCurrentView('player')}
        />
      ) : (
        /* View 3: Clean Homepage UI */
        <>
          {/* Ambient Halo concentric lighting */}
          <HaloBackground enablePulse={preferences.haloMotion} />

          {/* Sparse Navigation */}
          <Navbar
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenArtists={() => {
              setSelectedArtistId('coldplay');
              setCurrentView('artist');
            }}
          />

          {/* Main Page Layout */}
          <main className="main-viewport">
            {/* Centered Hero & Video Input */}
            <Hero>
              <VideoInput
                onStartSession={(src) => {
                  setPreviousView('home');
                  handleStartSession(src);
                }}
              />
            </Hero>

            {/* Quiet Recently Played Area */}
            <RecentSessions
              sessions={recentSessions}
              onSelectSession={(src) => {
                setPreviousView('home');
                handleStartSession(src);
              }}
            />
          </main>

          {/* Minimal Footer */}
          <Footer
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Floating Active Player Pill (Preserves existing listening session on Home) */}
          {activeSession && (
            <div className="home-active-dock">
              <div className="home-dock-info">
                <span className="dock-status-dot" />
                <div className="dock-text">
                  <span className="dock-title">{activeSession.title}</span>
                  <span className="dock-subtitle">Playing now &middot; LRCLIB synchronized</span>
                </div>
              </div>
              <button
                type="button"
                className="home-dock-btn"
                onClick={() => setCurrentView('player')}
                title="Resume immersive player"
              >
                <span>Return to Player</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
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
