/**
 * WorkspaceBrowser.tsx
 *
 * PURPOSE:
 * Browse and mount local file system directories as workspaces. Allows users to
 * open actual folders from their Windows machine and edit files directly on disk.
 * Replaces the sandbox/browser storage approach with real file system access.
 *
 * FEATURES:
 * - Mount local directories as workspaces
 * - Browse all drives (C:\, D:\, etc.)
 * - Navigate folder hierarchy
 * - Open files for editing
 * - Create/delete files and folders
 * - Show workspace list
 */

import { useState, useEffect } from 'react';
import { realFileSystemService, type WorkspaceFolder, type FileEntry, type DriveInfo } from '@/services/filesystem/realFileSystemService';
import { useToast } from '@/components/ui';
import { HardDrive, FolderOpen, Folder, FileText, ChevronRight, ChevronDown, Plus, X, Home, RefreshCw } from 'lucide-react';
import '@/styles/WorkspaceBrowser.css';

interface WorkspaceBrowserProps {
  onFileSelect: (filePath: string) => void;
  activeFile: string | null;
}

export function WorkspaceBrowser({ onFileSelect, activeFile }: WorkspaceBrowserProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceFolder[]>([]);
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [directoryContents, setDirectoryContents] = useState<FileEntry[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadWorkspaces();
    loadDrives();
  }, []);

  const loadWorkspaces = () => {
    setWorkspaces(realFileSystemService.getWorkspaces());
  };

  const loadDrives = async () => {
    try {
      const driveList = await realFileSystemService.listDrives();
      setDrives(driveList);
    } catch (error) {
      console.error('Failed to load drives:', error);
      showToast({
        variant: 'error',
        title: 'Failed to load drives',
        message: 'Could not access system drives',
      });
    }
  };

  const handleMountWorkspace = async () => {
    try {
      const workspace = await realFileSystemService.mountWorkspaceWithPicker();
      if (workspace) {
        setWorkspaces([...workspaces, workspace]);
        setCurrentPath(workspace.path);
        await loadDirectory(workspace.path);

        showToast({
          variant: 'success',
          title: 'Workspace Mounted',
          message: `Mounted: ${workspace.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to mount workspace:', error);
      showToast({
        variant: 'error',
        title: 'Mount Failed',
        message: (error as Error).message,
      });
    }
  };

  const handleUnmountWorkspace = (workspaceId: string) => {
    if (realFileSystemService.unmountWorkspace(workspaceId)) {
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));

      showToast({
        variant: 'success',
        title: 'Workspace Unmounted',
        message: 'Folder removed from workspace',
      });
    }
  };

  const loadDirectory = async (dirPath: string) => {
    setLoading(true);
    try {
      const contents = await realFileSystemService.readDirectory(dirPath);
      setDirectoryContents(contents);
      setCurrentPath(dirPath);
    } catch (error) {
      console.error('Failed to load directory:', error);
      showToast({
        variant: 'error',
        title: 'Failed to Load Directory',
        message: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDriveClick = (drive: DriveInfo) => {
    loadDirectory(drive.path);
  };

  const handleDirectoryClick = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      const isExpanded = expandedDirs.has(entry.path);
      if (isExpanded) {
        const newExpanded = new Set(expandedDirs);
        newExpanded.delete(entry.path);
        setExpandedDirs(newExpanded);
      } else {
        const newExpanded = new Set(expandedDirs);
        newExpanded.add(entry.path);
        setExpandedDirs(newExpanded);
        loadDirectory(entry.path);
      }
    } else {
      onFileSelect(entry.path);
    }
  };

  const handleGoUp = () => {
    if (!currentPath) return;

    const parts = currentPath.split(/[/\\]/);
    parts.pop();
    const parentPath = parts.join('/') || (parts[0] ? parts[0] + '/' : '');

    if (parentPath) {
      loadDirectory(parentPath);
    }
  };

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      return expandedDirs.has(entry.path) ? <ChevronDown size={16} /> : <ChevronRight size={16} />;
    }

    const ext = entry.extension?.toLowerCase();
    const colorMap: Record<string, string> = {
      ts: '#3178c6',
      tsx: '#3178c6',
      js: '#f7df1e',
      jsx: '#f7df1e',
      py: '#3776ab',
      html: '#e34f26',
      css: '#1572b6',
      json: '#000000',
      md: '#083fa1',
    };

    return <FileText size={16} color={colorMap[ext || ''] || '#6b7280'} />;
  };

  const formatPath = (path: string) => {
    if (path.length > 50) {
      return '...' + path.slice(-47);
    }
    return path;
  };

  return (
    <div className="workspace-browser">
      {/* Workspaces Panel */}
      <div className="workspace-panel">
        <div className="workspace-header">
          <h3>Workspaces</h3>
          <button className="mount-workspace-btn" onClick={handleMountWorkspace} title="Mount Folder">
            <Plus size={16} />
          </button>
        </div>

        <div className="workspace-list">
          {workspaces.length === 0 ? (
            <div className="empty-workspaces">
              <FolderOpen size={48} opacity={0.3} />
              <p>No workspaces mounted</p>
              <button className="mount-workspace-btn-large" onClick={handleMountWorkspace}>
                <Plus size={18} />
                Mount Folder
              </button>
            </div>
          ) : (
            workspaces.map((workspace) => (
              <div key={workspace.id} className="workspace-item">
                <div className="workspace-info" onClick={() => loadDirectory(workspace.path)}>
                  <FolderOpen size={18} />
                  <div className="workspace-details">
                    <span className="workspace-name">{workspace.name}</span>
                    <span className="workspace-path">{formatPath(workspace.path)}</span>
                  </div>
                </div>
                <button
                  className="unmount-btn"
                  onClick={() => handleUnmountWorkspace(workspace.id)}
                  title="Unmount"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Drive Browser */}
      <div className="drive-browser">
        <div className="drive-header">
          <h3>Drives</h3>
          <button className="refresh-btn" onClick={loadDrives} title="Refresh Drives">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="drive-list">
          {drives.map((drive) => (
            <div
              key={drive.path}
              className="drive-item"
              onClick={() => handleDriveClick(drive)}
            >
              <HardDrive size={18} />
              <div className="drive-info">
                <span className="drive-name">{drive.name}</span>
                <span className="drive-path">{drive.path}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Browser */}
      {currentPath && (
        <div className="file-browser">
          <div className="file-browser-header">
            <button className="nav-up-btn" onClick={handleGoUp} title="Go Up">
              <Home size={16} />
            </button>
            <span className="current-path" title={currentPath}>
              {formatPath(currentPath)}
            </span>
          </div>

          {loading ? (
            <div className="loading-indicator">
              <RefreshCw size={24} className="spinning" />
              <span>Loading...</span>
            </div>
          ) : (
            <div className="file-list">
              {directoryContents.map((entry) => (
                <div
                  key={entry.path}
                  className={`file-entry ${entry.type} ${activeFile === entry.path ? 'active' : ''}`}
                  onClick={() => handleDirectoryClick(entry)}
                  title={entry.path}
                >
                  <span className="file-icon">{getFileIcon(entry)}</span>
                  <span className="file-name">{entry.name}</span>
                  {entry.type === 'file' && entry.size !== undefined && (
                    <span className="file-size">{formatBytes(entry.size)}</span>
                  )}
                </div>
              ))}

              {directoryContents.length === 0 && (
                <div className="empty-directory">
                  <Folder size={48} opacity={0.3} />
                  <p>Empty directory</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
}

export default WorkspaceBrowser;
