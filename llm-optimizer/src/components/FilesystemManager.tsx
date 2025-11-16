import { useState, useEffect } from 'react';
import { filesystemService, type DriveInfo, type DirectoryEntry } from '../services/filesystemService';

function FilesystemManager() {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  useEffect(() => {
    loadDrives();
  }, []);

  const loadDrives = async () => {
    setLoading(true);
    try {
      const driveList = await filesystemService.listDrives();
      setDrives(driveList);
      if (driveList.length > 0) {
        setCurrentPath(driveList[0].letter + '\\');
        await browseDirectory(driveList[0].letter + '\\');
      }
    } catch (error) {
      console.error('Failed to load drives:', error);
    } finally {
      setLoading(false);
    }
  };

  const browseDirectory = async (dirPath: string) => {
    setLoading(true);
    try {
      const dirEntries = await filesystemService.browseDirectory(dirPath);
      setEntries(dirEntries);
      setCurrentPath(dirPath);
    } catch (error) {
      console.error('Failed to browse directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanTempFiles = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const result = await filesystemService.cleanTempFiles();
      setCleanupResult(result);
    } catch (error) {
      setCleanupResult({
        filesDeleted: 0,
        spaceFreed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setCleaning(false);
    }
  };

  const handleCleanCache = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const result = await filesystemService.cleanCache();
      setCleanupResult(result);
    } catch (error) {
      setCleanupResult({
        filesDeleted: 0,
        spaceFreed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setCleaning(false);
    }
  };

  const handleCleanRegistry = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const result = await filesystemService.cleanRegistry();
      setCleanupResult(result);
    } catch (error) {
      setCleanupResult({
        cleaned: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setCleaning(false);
    }
  };

  const handleDeepClean = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const result = await filesystemService.deepCleanSystem();
      setCleanupResult(result);
    } catch (error) {
      setCleanupResult({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setCleaning(false);
    }
  };

  if (loading && drives.length === 0) {
    return (
      <div className="card">
        <div className="loading"></div>
        <span>Loading drives...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>💾 Filesystem Manager</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Browse drives, manage files, and clean your system
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          <div>
            <h3 style={{ marginBottom: '1rem' }}>Drives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {drives.map((drive) => (
                <button
                  key={drive.letter}
                  onClick={() => browseDirectory(drive.letter + '\\')}
                  style={{
                    padding: '0.75rem',
                    background: currentPath.startsWith(drive.letter)
                      ? 'rgba(102, 126, 234, 0.2)'
                      : 'rgba(30, 30, 45, 0.6)',
                    border: `1px solid ${currentPath.startsWith(drive.letter) ? '#667eea' : 'rgba(100, 100, 150, 0.2)'}`,
                    borderRadius: '8px',
                    color: '#e0e0e0',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{drive.letter} {drive.label}</div>
                  <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                    {filesystemService.formatBytes(drive.freeSpace)} free of{' '}
                    {filesystemService.formatBytes(drive.totalSpace)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem' }}>
              {currentPath || 'Select a drive'}
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {entries.map((entry) => (
                  <div
                    key={entry.path}
                    onClick={() => entry.isDirectory && browseDirectory(entry.path)}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(30, 30, 45, 0.4)',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      cursor: entry.isDirectory ? 'pointer' : 'default',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ marginRight: '0.5rem' }}>
                        {entry.isDirectory ? '📁' : '📄'}
                      </span>
                      {entry.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#a0a0a0' }}>
                      {filesystemService.formatBytes(entry.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🧹 System Cleanup</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Automated cleanup with safety checks - removes old files, cache, and registry entries
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            className="button"
            onClick={handleCleanTempFiles}
            disabled={cleaning}
          >
            {cleaning ? '⏳ Cleaning...' : '🗑️ Clean Temp Files'}
          </button>
          <button
            className="button"
            onClick={handleCleanCache}
            disabled={cleaning}
          >
            {cleaning ? '⏳ Cleaning...' : '🧼 Clean Cache'}
          </button>
          <button
            className="button"
            onClick={handleCleanRegistry}
            disabled={cleaning}
          >
            {cleaning ? '⏳ Cleaning...' : '🔧 Clean Registry'}
          </button>
          <button
            className="button"
            onClick={handleDeepClean}
            disabled={cleaning}
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            }}
          >
            {cleaning ? '⏳ Deep Cleaning...' : '⚡ Deep Clean System'}
          </button>
        </div>

        {cleanupResult && (
          <div style={{
            padding: '1rem',
            background: 'rgba(30, 30, 45, 0.6)',
            borderRadius: '8px',
            marginTop: '1rem',
          }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Cleanup Results</h3>
            {cleanupResult.filesDeleted !== undefined && (
              <div>
                <p>Files Deleted: {cleanupResult.filesDeleted}</p>
                <p>Space Freed: {filesystemService.formatBytes(cleanupResult.spaceFreed)}</p>
              </div>
            )}
            {cleanupResult.cleaned !== undefined && (
              <div>
                <p>Registry Entries Cleaned: {cleanupResult.cleaned}</p>
              </div>
            )}
            {cleanupResult.tempFiles && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Temp Files:</h4>
                <p>Deleted: {cleanupResult.tempFiles.filesDeleted}</p>
                <p>Space Freed: {filesystemService.formatBytes(cleanupResult.tempFiles.spaceFreed)}</p>
              </div>
            )}
            {cleanupResult.cache && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Cache:</h4>
                <p>Deleted: {cleanupResult.cache.filesDeleted}</p>
                <p>Space Freed: {filesystemService.formatBytes(cleanupResult.cache.spaceFreed)}</p>
              </div>
            )}
            {cleanupResult.errors && cleanupResult.errors.length > 0 && (
              <div style={{ marginTop: '1rem', color: '#f87171' }}>
                <h4>Errors:</h4>
                <ul style={{ paddingLeft: '1.5rem' }}>
                  {cleanupResult.errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilesystemManager;

