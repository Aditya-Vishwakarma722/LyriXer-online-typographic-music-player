import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Link2,
  Play,
  Upload,
  FileVideo,
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
  ArrowRight,
  Clipboard,
  Timer,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import SpotlightCard from '../../components/reactbits/SpotlightCard';
import {
  validateYouTubeUrl,
  fetchYouTubeMetadata,
  detectVideoIntroOffset,
  parseTimeStringToSeconds,
} from '../../utils/youtube';
import { formatFileSize, formatDuration } from '../../utils/formatters';
import type { VideoSource } from '../../types/session';
import './VideoInput.css';

interface VideoInputProps {
  onStartSession: (source: VideoSource) => void;
}

export const VideoInput: React.FC<VideoInputProps> = ({ onStartSession }) => {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Preparing session...');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionSuccessToast, setSessionSuccessToast] = useState<string | null>(null);
  const [lyricsStartTime, setLyricsStartTime] = useState<string>('');
  const [autoDetectedSec, setAutoDetectedSec] = useState<number>(0);
  const [detectedVideoId, setDetectedVideoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automatically detect video ID and intro start timestamp whenever URL changes
  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setDetectedVideoId(null);
      setAutoDetectedSec(0);
      setLyricsStartTime('');
      return;
    }

    const validation = validateYouTubeUrl(trimmed);
    if (validation.isValid && validation.videoId) {
      setDetectedVideoId(validation.videoId);
      const intro = validation.startTime ?? detectVideoIntroOffset(validation.videoId, trimmed);
      setAutoDetectedSec(intro);
      setLyricsStartTime(formatDuration(intro));
    } else {
      setDetectedVideoId(null);
      setAutoDetectedSec(0);
      setLyricsStartTime('');
    }
  }, [url]);

  // Handle URL changes with automatic clearing of errors on typing
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Quick paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setErrorMessage(null);
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
  };

  // Submit YouTube URL
  const handleSubmitUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const validation = validateYouTubeUrl(url);

    if (!validation.isValid || !validation.videoId) {
      setErrorMessage(validation.errorMessage || 'Please enter a valid YouTube video link.');
      return;
    }

    // Determine the final lyrics start offset
    const userOffset = lyricsStartTime.trim() ? parseTimeStringToSeconds(lyricsStartTime) : 0;
    // Preserve full decimal precision of auto-detected offset unless user manually typed a custom time
    const finalOffset =
      userOffset > 0 && Math.abs(userOffset - autoDetectedSec) > 1
        ? userOffset
        : (autoDetectedSec > 0 ? autoDetectedSec : userOffset);

    setErrorMessage(null);
    setIsLoading(true);
    setLoadingStep('Fetching track details from YouTube...');

    try {
      const meta = await fetchYouTubeMetadata(validation.videoId);
      setLoadingStep('Connecting to LRCLIB (https://lrclib.net)...');

      setTimeout(() => {
        setIsLoading(false);
        const source: VideoSource = {
          kind: 'youtube',
          sourceId: validation.videoId!,
          title: meta.cleanTitle || meta.title,
          artist: meta.cleanArtist || meta.author,
          thumbnailUrl: `https://img.youtube.com/vi/${validation.videoId}/hqdefault.jpg`,
          startOffset: finalOffset,
        };
        onStartSession(source);
        setSessionSuccessToast(`Loaded track: ${source.title}`);
        setTimeout(() => setSessionSuccessToast(null), 4000);
      }, 500);
    } catch {
      setIsLoading(false);
      const source: VideoSource = {
        kind: 'youtube',
        sourceId: validation.videoId,
        title: `YouTube Video (${validation.videoId})`,
        thumbnailUrl: `https://img.youtube.com/vi/${validation.videoId}/hqdefault.jpg`,
        startOffset: finalOffset,
      };
      onStartSession(source);
    }
  };

  // Local File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleSelectedFile(files[0]);
    }
  };

  const handleSelectedFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Please select a valid video file (MP4, WebM, MKV, etc.).');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartLocalFile = () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setLoadingStep('Preparing local video pipeline...');

    setTimeout(() => {
      setIsLoading(false);
      const source: VideoSource = {
        kind: 'local',
        sourceId: `local-${selectedFile.name}-${selectedFile.lastModified}`,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        localFile: selectedFile,
        fileMetadata: {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified,
        },
      };
      onStartSession(source);
      setSessionSuccessToast(`Selected local video: "${selectedFile.name}" ready for playback`);
      setTimeout(() => setSessionSuccessToast(null), 4000);
    }, 800);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`video-input-container ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/mp4,video/webm,video/ogg,video/x-matroska,video/quicktime"
        className="hidden-file-input"
        aria-label="Upload local video file"
      />

      {/* Main Glass Input Card with React Bits Spotlight */}
      <SpotlightCard
        className={`input-glass-card ${isFocused ? 'card-focused' : ''} ${
          errorMessage ? 'card-error' : ''
        }`}
        spotlightColor="rgba(167, 139, 250, 0.25)"
        intensity={0.25}
        spotlightSize={300}
        borderGlow={0.7}
        ambient={true}
        flare={true}
        grain={0.06}
      >
        {selectedFile ? (
          /* State: Local File Selected */
          <div className="selected-file-view">
            <div className="file-info-col">
              <div className="file-icon-wrapper">
                <FileVideo size={22} className="file-icon" />
              </div>
              <div className="file-details">
                <span className="file-name" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <span className="file-meta">
                  {formatFileSize(selectedFile.size)} • Local Video
                </span>
              </div>
            </div>

            <div className="file-actions-col">
              <button
                type="button"
                className="btn-text-subtle"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Change
              </button>

              <button
                type="button"
                className="file-remove-btn"
                onClick={handleRemoveFile}
                aria-label="Remove selected video"
                disabled={isLoading}
              >
                <X size={16} />
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={handleStartLocalFile}
                isLoading={isLoading}
                rightIcon={<Play size={15} fill="currentColor" />}
              >
                {isLoading ? loadingStep : 'Start Listening'}
              </Button>
            </div>
          </div>
        ) : (
          /* State: URL Input Form */
          <form onSubmit={handleSubmitUrl} className="url-form">
            <div className="input-field-wrapper">
              <Link2 size={18} className="input-link-icon" />

              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Paste a YouTube music video link..."
                className="url-text-input"
                disabled={isLoading}
                aria-label="YouTube music video URL"
                spellCheck={false}
                autoComplete="off"
              />

              {url && (
                <button
                  type="button"
                  className="input-clear-btn"
                  onClick={() => {
                    setUrl('');
                    setErrorMessage(null);
                  }}
                  aria-label="Clear input"
                >
                  <X size={14} />
                </button>
              )}

              {!url && (
                <button
                  type="button"
                  className="input-paste-btn"
                  onClick={handlePasteClipboard}
                  title="Paste from clipboard"
                  aria-label="Paste URL from clipboard"
                >
                  <Clipboard size={14} />
                  <span>Paste</span>
                </button>
              )}
            </div>

            {/* Added timestamp for the pasted YouTube video where lyrics begin */}
            {detectedVideoId && (
              <div className="pasted-timestamp-row">
                <div className="pasted-timestamp-label">
                  <Timer size={13} className="timestamp-icon" />
                  <span>Lyrics Start:</span>
                </div>
                <div className="pasted-timestamp-input-wrap">
                  <input
                    type="text"
                    value={lyricsStartTime}
                    onChange={(e) => setLyricsStartTime(e.target.value)}
                    placeholder="0:00"
                    className="pasted-timestamp-input"
                    title="Timestamp where the lyrics/vocals begin in the video (e.g. 0:21 or 21)"
                    aria-label="Lyrics start timestamp"
                  />
                  {autoDetectedSec > 0 && (
                    <span className="auto-intro-badge">
                      Auto-detected intro ({formatDuration(autoDetectedSec)})
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="form-submit-wrapper">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight size={16} />}
              >
                {isLoading ? loadingStep : 'Start Listening'}
              </Button>
            </div>
          </form>
        )}
      </SpotlightCard>

      {/* Inline Validation Feedback - layout height reserved without shifting */}
      <div className="validation-area" role="alert" aria-live="polite">
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              key="error-box"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="inline-error-message"
            >
              <AlertCircle size={14} className="error-icon" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
          {sessionSuccessToast && (
            <motion.div
              key="success-box"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="inline-success-message"
            >
              <CheckCircle2 size={14} className="success-icon" />
              <span>{sessionSuccessToast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Secondary Action: Choose a Video */}
      {!selectedFile && (
        <div className="secondary-action-row">
          <span className="or-divider">or</span>
          <button
            type="button"
            className="choose-video-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload size={14} className="choose-video-icon" />
            <span>Choose a Video</span>
          </button>
        </div>
      )}

      {/* Trust & Licensing Note */}
      <div className="trust-note-row">
        <Shield size={13} className="trust-shield-icon" />
        <p className="trust-note-text">
          Local video files remain on your device and are never uploaded to any server.
          Please ensure local media is owned or permitted for use.
        </p>
      </div>
    </div>
  );
};
