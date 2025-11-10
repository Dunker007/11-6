import { useEffect, useState } from 'react';
import { Download, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/UpdateNotification.css';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Listen for update events from Electron main process via preload API
    if (typeof window === 'undefined' || !(window as any).updater) {
      return;
    }

    const handleUpdateAvailable = (info: UpdateInfo) => {
      setUpdateAvailable(info);
      setUpdateError(null);
    };

    const handleUpdateDownloaded = (info: UpdateInfo) => {
      setUpdateDownloaded(info);
      setUpdateAvailable(null);
      setUpdateProgress(null);
    };

    const handleUpdateProgress = (progress: UpdateProgress) => {
      setUpdateProgress(progress);
    };

    const handleUpdateError = ({ error }: { error: string }) => {
      setUpdateError(error);
      setIsChecking(false);
    };

    const cleanupAvailable = (window as any).updater.onAvailable(handleUpdateAvailable);
    const cleanupDownloaded = (window as any).updater.onDownloaded(handleUpdateDownloaded);
    const cleanupProgress = (window as any).updater.onProgress(handleUpdateProgress);
    const cleanupError = (window as any).updater.onError(handleUpdateError);

    return () => {
      cleanupAvailable();
      cleanupDownloaded();
      cleanupProgress();
      cleanupError();
    };
  }, []);

  const handleCheckForUpdates = async () => {
    if (typeof window === 'undefined' || !(window as any).updater) {
      return;
    }

    setIsChecking(true);
    setUpdateError(null);
    try {
      const result = await (window as any).updater.check();
      if (!result.success) {
        setUpdateError(result.error || 'Failed to check for updates');
      }
    } catch (error) {
      setUpdateError((error as Error).message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (typeof window === 'undefined' || !(window as any).updater) {
      return;
    }

    try {
      await (window as any).updater.install();
    } catch (error) {
      setUpdateError((error as Error).message);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(null);
    setUpdateDownloaded(null);
    setUpdateProgress(null);
    setUpdateError(null);
  };

  // Don't show anything if not in Electron or no updates
  if (typeof window === 'undefined' || !(window as any).updater) {
    return null;
  }

  // Show update downloaded notification (highest priority)
  if (updateDownloaded) {
    return (
      <div className="update-notification update-downloaded">
        <div className="update-notification-content">
          <CheckCircle className="update-icon" size={20} />
          <div className="update-info">
            <div className="update-title">Update Ready to Install</div>
            <div className="update-version">Version {updateDownloaded.version} is ready</div>
            {updateDownloaded.releaseNotes && (
              <div className="update-notes">{updateDownloaded.releaseNotes}</div>
            )}
          </div>
        </div>
        <div className="update-actions">
          <button className="update-button install" onClick={handleInstallUpdate}>
            Install & Restart
          </button>
          <button className="update-button dismiss" onClick={handleDismiss}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Show update available notification
  if (updateAvailable) {
    return (
      <div className="update-notification update-available">
        <div className="update-notification-content">
          <Download className="update-icon" size={20} />
          <div className="update-info">
            <div className="update-title">Update Available</div>
            <div className="update-version">Version {updateAvailable.version}</div>
            {updateProgress && (
              <div className="update-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${updateProgress.percent}%` }}
                  />
                </div>
                <span className="progress-text">
                  {Math.round(updateProgress.percent)}% ({formatBytes(updateProgress.transferred)} / {formatBytes(updateProgress.total)})
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="update-actions">
          <button className="update-button dismiss" onClick={handleDismiss}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Show error notification (but suppress 406 errors)
  if (updateError) {
    // Don't show 406 errors - they're GitHub API format issues
    const is406Error = updateError.includes('406') || updateError.includes('Not Acceptable') || updateError.includes('suppressed');
    if (is406Error) {
      return null; // Silently ignore
    }
    
    return (
      <div className="update-notification update-error">
        <div className="update-notification-content">
          <AlertCircle className="update-icon" size={20} />
          <div className="update-info">
            <div className="update-title">Update Check Failed</div>
            <div className="update-error-text">{updateError}</div>
          </div>
        </div>
        <div className="update-actions">
          <button className="update-button retry" onClick={handleCheckForUpdates} disabled={isChecking}>
            <RefreshCw size={16} className={isChecking ? 'spinning' : ''} />
          </button>
          <button className="update-button dismiss" onClick={handleDismiss}>
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default UpdateNotification;

