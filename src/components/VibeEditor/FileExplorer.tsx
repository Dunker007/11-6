import { useState, useEffect } from 'react';
import type { ProjectFile } from '@/types/project';
import { useProjectStore } from '@/services/project/projectStore';
import { useActivityStore } from '@/services/activity/activityStore';
import { fileSystemService } from '@/services/filesystem/fileSystemService';
import { llmOptimizerService } from '@/services/ai/llmOptimizerService';
import TechIcon from '@/components/Icons/TechIcon';
import { FileText, FolderOpen, Folder, ChevronRight, ChevronDown, FilePlus, FolderPlus, Edit2, Copy, Scissors, Clipboard, Trash2, Dot, HardDrive, Search, FolderTree } from 'lucide-react';
import '@/styles/FileExplorer.css';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}

interface SystemFileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

function FileExplorer({ files, activeFile, onFileSelect }: FileExplorerProps) {
  const { addFile, deleteFile, activeProject } = useProjectStore();
  const { addActivity } = useActivityStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([files[0]?.path || '']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isDirectory: boolean } | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string; operation: 'copy' | 'cut' } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'project' | 'system'>('project');
  const [systemDrives, setSystemDrives] = useState<Array<{ name: string; path: string; type?: string }>>([]);
  const [systemFiles, setSystemFiles] = useState<Map<string, SystemFileEntry[]>>(new Map());
  const [directorySizes, setDirectorySizes] = useState<Map<string, number>>(new Map());
  const [loadingSize, setLoadingSize] = useState<string | null>(null);

  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, isDirectory: boolean) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path, isDirectory });
  };

  const handleNewFile = (dirPath: string) => {
    const fileName = prompt('File name:');
    if (fileName?.trim()) {
      const fullPath = `${dirPath}/${fileName}`;
      addFile(fullPath, '', detectLanguage(fileName));
      setExpandedDirs((prev) => new Set(prev).add(dirPath));
      addActivity('file', 'created', `Created ${fileName}`);
    }
    setContextMenu(null);
  };

  const handleNewFolder = (dirPath: string) => {
    const folderName = prompt('Folder name:');
    if (folderName?.trim()) {
      const fullPath = `${dirPath}/${folderName}`;
      // Create folder by adding a placeholder file inside it
      addFile(`${fullPath}/.gitkeep`, '', undefined);
      setExpandedDirs((prev) => new Set(prev).add(dirPath).add(fullPath));
      addActivity('file', 'created', `Created folder ${folderName}`);
    }
    setContextMenu(null);
  };

  const handleRename = (path: string) => {
    setRenamingPath(path);
    setContextMenu(null);
  };

  const handleRenameConfirm = (oldPath: string, newName: string) => {
    if (!newName?.trim() || !activeProject) {
      setRenamingPath(null);
      return;
    }

    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName.trim();
    const newPath = pathParts.join('/');

    if (newPath !== oldPath) {
      const file = findFile(files, oldPath);
      if (file && !file.isDirectory) {
        // For files: copy content and delete old
        const { projectService } = require('../../services/project/projectService');
        const content = projectService.getFileContent(activeProject.id, oldPath);
        addFile(newPath, content || '', detectLanguage(newName));
        deleteFile(oldPath);
        addActivity('file', 'updated', `Renamed ${file.name} to ${newName}`);
      }
      // Note: Directory rename requires recursive file updates
    }

    setRenamingPath(null);
  };

  const handleCopy = (path: string) => {
    setClipboard({ path, operation: 'copy' });
    setContextMenu(null);
  };

  const handleCut = (path: string) => {
    setClipboard({ path, operation: 'cut' });
    setContextMenu(null);
  };

  const handlePaste = (targetDirPath: string) => {
    if (!clipboard || !activeProject) {
      setContextMenu(null);
      return;
    }

    const file = findFile(files, clipboard.path);
    if (!file || file.isDirectory) {
      // Note: Directory copy/paste requires recursive file operations
      alert('Copying folders is not yet supported');
      setContextMenu(null);
      return;
    }

    const fileName = file.name;
    const newPath = `${targetDirPath}/${fileName}`;

    const { projectService } = require('../../services/project/projectService');
    const content = projectService.getFileContent(activeProject.id, clipboard.path);

    if (clipboard.operation === 'copy') {
      addFile(newPath, content || '', file.language);
    } else if (clipboard.operation === 'cut') {
      addFile(newPath, content || '', file.language);
      deleteFile(clipboard.path);
      setClipboard(null);
    }

    setExpandedDirs((prev) => new Set(prev).add(targetDirPath));
    setContextMenu(null);
  };

  const handleGetSize = async (dirPath: string) => {
    setLoadingSize(dirPath);
    try {
      const result = await fileSystemService.getDirectorySize(dirPath);
      if (result.success && result.data !== undefined) {
        setDirectorySizes(prev => new Map(prev).set(dirPath, result.data!));
        alert(`Directory size: ${formatBytes(result.data)}`);
      }
    } catch (error) {
      console.error('Failed to get directory size:', error);
    } finally {
      setLoadingSize(null);
      setContextMenu(null);
    }
  };

  const handleCleanTempFiles = async (_dirPath: string) => {
    if (!confirm('Clean temporary files in this directory?')) {
      setContextMenu(null);
      return;
    }
    try {
      const result = await llmOptimizerService.cleanTempFiles();
      alert(`Cleaned ${result.filesDeleted} files, freed ${formatBytes(result.spaceFreed)}`);
    } catch (error) {
      console.error('Failed to clean temp files:', error);
    } finally {
      setContextMenu(null);
    }
  };

  const handleFindLargeFiles = async (_dirPath: string) => {
    // This would scan for files > 100MB
    alert('Find Large Files feature coming soon');
    setContextMenu(null);
  };

  const handleDeleteFile = (path: string) => {
    const fileName = path.split('/').pop() || path;
    if (confirm(`Delete ${fileName}?`)) {
      deleteFile(path);
      addActivity('file', 'deleted', `Deleted ${fileName}`);
    }
    setContextMenu(null);
  };

  const renderSystemFile = (entry: SystemFileEntry, level: number = 0) => {
    const isExpanded = expandedDirs.has(entry.path);
    const dirSize = directorySizes.get(entry.path);
    
    if (entry.isDirectory) {
      return (
        <div key={entry.path}>
          <div
            className={`file-item directory ${isExpanded ? 'expanded' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              toggleDir(entry.path);
              if (!isExpanded) {
                loadSystemDirectory(entry.path);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, entry.path, true)}
          >
            <TechIcon 
              icon={isExpanded ? ChevronDown : ChevronRight} 
              size={14} 
              glow="none" 
              className="expand-icon" 
            />
            <TechIcon 
              icon={isExpanded ? FolderOpen : Folder} 
              size={16} 
              glow="none" 
              className="file-icon" 
            />
            <span className="file-name">{entry.name}</span>
            {dirSize !== undefined && (
              <span className="file-size" title={`Size: ${formatBytes(dirSize)}`}>
                {formatBytes(dirSize)}
              </span>
            )}
            {loadingSize === entry.path && (
              <span className="loading-indicator">...</span>
            )}
          </div>
          {isExpanded && systemFiles.has(entry.path) && (
            <div className="file-children">
              {systemFiles.get(entry.path)!.map((child) => renderSystemFile(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={entry.path}
        className="file-item file"
        style={{ paddingLeft: `${level * 16 + 24}px` }}
        onContextMenu={(e) => handleContextMenu(e, entry.path, false)}
      >
        <TechIcon icon={FileText} size={16} glow="none" className="file-icon" />
        <span className="file-name">{entry.name}</span>
      </div>
    );
  };

  useEffect(() => {
    if (viewMode === 'system') {
      const loadDrives = async () => {
        const result = await fileSystemService.listDrives();
        if (result.success && result.data) {
          setSystemDrives(result.data);
        }
      };
      loadDrives();
    }
  }, [viewMode]);

  const loadSystemDirectory = async (path: string) => {
    if (systemFiles.has(path)) return;
    try {
      const result = await fileSystemService.readdir(path);
      if (result.success && result.data) {
        setSystemFiles(prev => new Map(prev).set(path, result.data!.map(entry => ({
          name: entry.name,
          path: entry.path,
          isDirectory: entry.isDirectory,
        }))));
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  };

  const detectLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const getGitStatus = (path: string): 'modified' | 'added' | 'untracked' | null => {
    // Simulated Git status - in production, this would check actual Git status.
    // Use a deterministic hash so the same path always yields the same mock status.
    const hash = Array.from(path).reduce((acc, char) => {
      acc = (acc << 5) - acc + char.charCodeAt(0);
      return acc & acc;
    }, 0);

    const normalized = Math.abs(hash % 100);
    if (normalized < 5) return 'added';
    if (normalized < 15) return 'modified';
    if (normalized < 20) return 'untracked';
    return null;
  };

  const renderFile = (file: ProjectFile, level: number = 0) => {
    const isExpanded = expandedDirs.has(file.path);
    const isActive = activeFile === file.path;
    const isRenaming = renamingPath === file.path;
    const gitStatus = !file.isDirectory ? getGitStatus(file.path) : null;

    if (file.isDirectory) {
      return (
        <div key={file.path}>
          <div
            className={`file-item directory ${isExpanded ? 'expanded' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => !isRenaming && toggleDir(file.path)}
            onContextMenu={(e) => handleContextMenu(e, file.path, true)}
          >
            <TechIcon 
              icon={isExpanded ? ChevronDown : ChevronRight} 
              size={14} 
              glow="none" 
              className="expand-icon" 
            />
            <TechIcon 
              icon={isExpanded ? FolderOpen : Folder} 
              size={16} 
              glow="none" 
              className="file-icon" 
            />
            {isRenaming ? (
              <input
                type="text"
                className="rename-input"
                defaultValue={file.name}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameConfirm(file.path, e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setRenamingPath(null);
                  }
                }}
                onBlur={(e) => handleRenameConfirm(file.path, e.currentTarget.value)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="file-name">{file.name}</span>
            )}
          </div>
          {isExpanded && file.children && (
            <div className="file-children">
              {file.children.map((child) => renderFile(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={file.path}
        className={`file-item file ${isActive ? 'active' : ''} ${gitStatus ? `git-${gitStatus}` : ''}`}
        style={{ paddingLeft: `${level * 16 + 24}px` }}
        onClick={() => !isRenaming && onFileSelect(file.path)}
        onContextMenu={(e) => handleContextMenu(e, file.path, false)}
      >
        <TechIcon icon={FileText} size={16} glow="none" className="file-icon" />
        {gitStatus && (
          <span className={`git-status-led ${gitStatus}`} title={`Git: ${gitStatus}`}>
            <TechIcon icon={Dot} size={8} glow="none" />
          </span>
        )}
        {isRenaming ? (
          <input
            type="text"
            className="rename-input"
            defaultValue={file.name}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameConfirm(file.path, e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setRenamingPath(null);
              }
            }}
            onBlur={(e) => handleRenameConfirm(file.path, e.currentTarget.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="file-name">{file.name}</span>
        )}
      </div>
    );
  };

  return (
    <div className="file-explorer">
      <div className="explorer-toolbar">
        <button
          className={`toolbar-button ${viewMode === 'project' ? 'active' : ''}`}
          onClick={() => setViewMode('project')}
          title="Project View"
        >
          <TechIcon icon={FolderTree} size={16} glow="none" />
        </button>
        <button
          className={`toolbar-button ${viewMode === 'system' ? 'active' : ''}`}
          onClick={() => setViewMode('system')}
          title="System View"
        >
          <TechIcon icon={HardDrive} size={16} glow="none" />
        </button>
        {viewMode === 'project' && (
          <>
            <button
              className="toolbar-button"
              onClick={() => {
                const rootPath = files[0]?.path || '';
                handleNewFile(rootPath);
              }}
              title="New File"
            >
              <TechIcon icon={FilePlus} size={16} glow="none" />
            </button>
            <button
              className="toolbar-button"
              onClick={() => {
                const rootPath = files[0]?.path || '';
                handleNewFolder(rootPath);
              }}
              title="New Folder"
            >
              <TechIcon icon={FolderPlus} size={16} glow="none" />
            </button>
          </>
        )}
      </div>

      <div className="file-tree">
        {viewMode === 'system' ? (
          systemDrives.length > 0 ? (
            systemDrives.map((drive) => (
              <div key={drive.path}>
                <div
                  className={`file-item directory ${expandedDirs.has(drive.path) ? 'expanded' : ''}`}
                  onClick={() => {
                    toggleDir(drive.path);
                    if (!expandedDirs.has(drive.path)) {
                      loadSystemDirectory(drive.path);
                    }
                  }}
                  onContextMenu={(e) => handleContextMenu(e, drive.path, true)}
                >
                  <TechIcon 
                    icon={expandedDirs.has(drive.path) ? ChevronDown : ChevronRight} 
                    size={14} 
                    glow="none" 
                    className="expand-icon" 
                  />
                  <TechIcon icon={HardDrive} size={16} glow="none" className="file-icon" />
                  <span className="file-name">{drive.name}</span>
                  {drive.type && <span className="drive-type">{drive.type}</span>}
                </div>
                {expandedDirs.has(drive.path) && systemFiles.has(drive.path) && (
                  <div className="file-children">
                    {systemFiles.get(drive.path)!.map((entry) => renderSystemFile(entry, 1))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">Loading drives...</div>
          )
        ) : (
          files.map((file) => renderFile(file))
        )}
      </div>

      {contextMenu && (
        <>
          <div
            className="context-menu-overlay"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.isDirectory && (
              <>
                <button
                  className="context-menu-item"
                  onClick={() => handleGetSize(contextMenu.path)}
                >
                  <TechIcon icon={Search} size={14} glow="none" />
                  <span>Get Size</span>
                </button>
                {contextMenu.path.toLowerCase().includes('temp') && (
                  <button
                    className="context-menu-item"
                    onClick={() => handleCleanTempFiles(contextMenu.path)}
                  >
                    <TechIcon icon={Trash2} size={14} glow="none" />
                    <span>Clean Temp Files</span>
                  </button>
                )}
                <button
                  className="context-menu-item"
                  onClick={() => handleFindLargeFiles(contextMenu.path)}
                >
                  <TechIcon icon={Search} size={14} glow="none" />
                  <span>Find Large Files</span>
                </button>
                <div className="context-menu-divider" />
              </>
            )}
            {viewMode === 'project' && (
              <>
                {contextMenu.isDirectory && (
                  <>
                    <button
                      className="context-menu-item"
                      onClick={() => handleNewFile(contextMenu.path)}
                    >
                      <TechIcon icon={FilePlus} size={14} glow="none" />
                      <span>New File</span>
                    </button>
                    <button
                      className="context-menu-item"
                      onClick={() => handleNewFolder(contextMenu.path)}
                    >
                      <TechIcon icon={FolderPlus} size={14} glow="none" />
                      <span>New Folder</span>
                    </button>
                    <div className="context-menu-divider" />
                  </>
                )}
                <button
                  className="context-menu-item"
                  onClick={() => handleRename(contextMenu.path)}
                >
                  <TechIcon icon={Edit2} size={14} glow="none" />
                  <span>Rename</span>
                </button>
                <button
                  className="context-menu-item"
                  onClick={() => handleCopy(contextMenu.path)}
                >
                  <TechIcon icon={Copy} size={14} glow="none" />
                  <span>Copy</span>
                </button>
                <button
                  className="context-menu-item"
                  onClick={() => handleCut(contextMenu.path)}
                >
                  <TechIcon icon={Scissors} size={14} glow="none" />
                  <span>Cut</span>
                </button>
                {clipboard && contextMenu.isDirectory && (
                  <button
                    className="context-menu-item"
                    onClick={() => handlePaste(contextMenu.path)}
                  >
                    <TechIcon icon={Clipboard} size={14} glow="none" />
                    <span>Paste</span>
                  </button>
                )}
                <div className="context-menu-divider" />
                <button
                  className="context-menu-item danger"
                  onClick={() => handleDeleteFile(contextMenu.path)}
                >
                  <TechIcon icon={Trash2} size={14} glow="none" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function findFile(files: ProjectFile[], path: string): ProjectFile | null {
  for (const file of files) {
    if (file.path === path) return file;
    if (file.children) {
      const found = findFile(file.children, path);
      if (found) return found;
    }
  }
  return null;
}

export default FileExplorer;


