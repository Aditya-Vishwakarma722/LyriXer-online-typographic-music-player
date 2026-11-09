import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { YoutubeIcon } from '../../components/ui/Icons';
import { FileVideo, Sparkles, Check, Copy, ArrowLeft } from 'lucide-react';
import type { VideoSource } from '../../types/session';
import { formatFileSize, formatDuration } from '../../utils/formatters';
import './SessionLaunchModal.css';

interface SessionLaunchModalProps {
  session: VideoSource | null;
  onClose: () => void;
}

export const SessionLaunchModal: React.FC<SessionLaunchModalProps> = ({ session, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(session, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={Boolean(session)}
      onClose={onClose}
      title="Session Initialized"
      description="Source validated and dispatched to the player interface pipeline."
      maxWidth="540px"
    >
      <div className="launch-modal-content">
        {/* Source Visual Card */}
        <div className="launch-card">
          {session.thumbnailUrl ? (
            <div className="launch-thumbnail-wrap">
              <img
                src={session.thumbnailUrl}
                alt={session.title}
                className="launch-thumbnail-img"
              />
              <div className="launch-source-badge">
                <YoutubeIcon size={12} />
                <span>YouTube</span>
              </div>
            </div>
          ) : (
            <div className="launch-thumbnail-fallback">
              <FileVideo size={32} />
              <div className="launch-source-badge">
                <FileVideo size={12} />
                <span>Local File</span>
              </div>
            </div>
          )}

          <div className="launch-meta">
            <h3 className="launch-title">{session.title}</h3>
            <div className="launch-details">
              <span>Source ID: <code>{session.sourceId}</code></span>
              {session.fileMetadata && (
                <span>Size: {formatFileSize(session.fileMetadata.size)}</span>
              )}
              {session.duration && (
                <span>Duration: {formatDuration(session.duration)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Phase 1 Handshake Notice */}
        <div className="launch-notice-box">
          <div className="launch-notice-header">
            <Sparkles size={15} className="launch-notice-icon" />
            <span className="launch-notice-title">Ready for Phase 2 Integration</span>
          </div>
          <p className="launch-notice-desc">
            As specified in the Phase 1 UI Foundation brief, playback orchestration and lyrics
            fetching are decoupled into subsequent roadmap milestones. Your input has been validated
            against the <code>VideoSource</code> contract and is ready for the YouTube IFrame API
            and HTML5 video adapters.
          </p>
        </div>

        {/* Actions */}
        <div className="launch-actions">
          <Button
            variant="secondary"
            size="md"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopyJson}
          >
            {copied ? 'Copied Contract' : 'Copy Source JSON'}
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<ArrowLeft size={15} />}
            onClick={onClose}
          >
            Return to Homepage
          </Button>
        </div>
      </div>
    </Modal>
  );
};
