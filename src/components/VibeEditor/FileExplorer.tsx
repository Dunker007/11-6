import { useState } from 'react';
import type { ProjectFile } from '@/types/project';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import TechIcon from '../Icons/TechIcon';
import { FileText, FolderOpen, Folder, ChevronRight, ChevronDown, FilePlus, FolderPlus, Edit2, Copy, Scissors, Clipboard, Trash2, Dot } from 'lucide-react';
import '../../styles/FileExplorer.css';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}

function FileExplorer({ files, activeFile, onFileSelect }: FileExplorerProps) {
  const { addFile, deleteFile, activeProject } = useProjectStore();
  const { addActivity } = useActivityStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([files[0]?.path || '']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isDirectory: boolean } | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string; operation: 'copy' | 'cut' } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);

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

  const handleDeleteFile = (path: string) => {
    const fileName = path.split('/').pop() || path;
    if (confirm(`Delete ${fileName}?`)) {
      deleteFile(path);
      addActivity('file', 'deleted', `Deleted ${fileName}`);
    }
    setContextMenu(null);
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
    // Simulated Git status - in production, this would check actual Git status
    // For now, randomly assign status to demonstrate UI
    if (Math.random() > 0.8) return 'modified';
    if (Math.random() > 0.9) return 'added';
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
      </div>

      <div className="file-tree">
        {files.map((file) => renderFile(file))}
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
          >
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


