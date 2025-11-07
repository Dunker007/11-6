import { useState, useEffect } from 'react';
import { updateService } from '../../services/update/updateService';
import type { UpdateInfo, UpdateProgress } from '../../types/update';
import Markdown from 'react-markdown';
import '../../styles/UpdateNotification.css';

interface UpdateNotificationProps {
  onClose?: () => void;
}

function UpdateNotification({ onClose }: UpdateNotificationProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAvailable = updateService.on('available', (info: UpdateInfo) => {
      setUpdateInfo(info);
      setError(null);
    });

    const unsubscribeDownloaded = updateService.on('downloaded', (info: UpdateInfo) => {
      setIsDownloaded(true);
      setUpdateInfo(info);
      setProgress(null);
    });

    const unsubscribeProgress = updateService.on('progress', (prog: UpdateProgress) => {
      setProgress(prog);
    });

    const unsubscribeError = updateService.on('error', (err: { error: string }) => {
      setError(err.error);
    });

    return () => {
      unsubscribeAvailable();
      unsubscribeDownloaded();
      unsubscribeProgress();
      unsubscribeError();
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    try {
      const result = await updateService.installUpdate();
      if (!result.success) {
        setError(result.error || 'Failed to install update');
        setIsInstalling(false);
      }
      // If successful, app will restart
    } catch (err) {
      setError((err as Error).message);
      setIsInstalling(false);
    }
  };

  const handleLater = () => {
    onClose?.();
  };

  if (!updateInfo && !error) {
    return null;
  }

  return (
    <div className="update-notification-overlay">
      <div className="update-notification">
        <div className="update-header">
          <h2>🔄 Update Available</h2>
          {!isDownloaded && <button className="update-close" onClick={handleLater}>×</button>}
        </div>

        {error && (
          <div className="update-error">
            <p>Error: {error}</p>
          </div>
        )}

        {updateInfo && (
          <>
            <div className="update-info">
              <p className="update-version">Version {updateInfo.version}</p>
              {updateInfo.releaseDate && (
                <p className="update-date">Released: {new Date(updateInfo.releaseDate).toLocaleDateString()}</p>
              )}
            </div>

            {updateInfo.releaseNotes && (
              <div className="update-notes">
                <h3>What's New</h3>
                <div className="update-notes-content">
                  <Markdown>{updateInfo.releaseNotes}</Markdown>
                </div>
              </div>
            )}

            {progress && !isDownloaded && (
              <div className="update-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
                <p className="progress-text">
                  Downloading... {Math.round(progress.percent)}% 
                  ({formatBytes(progress.transferred)} / {formatBytes(progress.total)})
                </p>
              </div>
            )}

            {isDownloaded && (
              <div className="update-downloaded">
                <p>✅ Update downloaded successfully!</p>
                <p className="update-install-hint">The app will restart to install the update.</p>
              </div>
            )}

            <div className="update-actions">
              {isDownloaded ? (
                <button 
                  className="update-button update-install" 
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? 'Installing...' : 'Install & Restart'}
                </button>
              ) : (
                <>
                  <button className="update-button update-later" onClick={handleLater}>
                    Later
                  </button>
                  <button 
                    className="update-button update-install" 
                    onClick={handleInstall}
                    disabled={!!progress || isInstalling}
                  >
                    {progress ? 'Downloading...' : isInstalling ? 'Installing...' : 'Install Now'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default UpdateNotification;

