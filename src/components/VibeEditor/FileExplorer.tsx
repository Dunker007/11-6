import { useState } from 'react';
import type { ProjectFile } from '@/types/project';
import { useProjectStore } from '../../services/project/projectStore';
import '../../styles/FileExplorer.css';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}

function FileExplorer({ files, activeFile, onFileSelect }: FileExplorerProps) {
  const { addFile, deleteFile, activeProject } = useProjectStore();
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
      }
      // TODO: For directories, would need recursive rename
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
      // TODO: Support directory copy/paste
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
    if (confirm('Delete this file?')) {
      deleteFile(path);
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

  const renderFile = (file: ProjectFile, level: number = 0) => {
    const isExpanded = expandedDirs.has(file.path);
    const isActive = activeFile === file.path;
    const isRenaming = renamingPath === file.path;

    if (file.isDirectory) {
      return (
        <div key={file.path}>
          <div
            className={`file-item directory ${isExpanded ? 'expanded' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => !isRenaming && toggleDir(file.path)}
            onContextMenu={(e) => handleContextMenu(e, file.path, true)}
          >
            <span className="file-icon">{isExpanded ? '📂' : '📁'}</span>
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
        className={`file-item file ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => !isRenaming && onFileSelect(file.path)}
        onContextMenu={(e) => handleContextMenu(e, file.path, false)}
      >
        <span className="file-icon">📄</span>
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
          📄
        </button>
        <button
          className="toolbar-button"
          onClick={() => {
            const rootPath = files[0]?.path || '';
            handleNewFolder(rootPath);
          }}
          title="New Folder"
        >
          📁
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
                  📄 New File
                </button>
                <button
                  className="context-menu-item"
                  onClick={() => handleNewFolder(contextMenu.path)}
                >
                  📁 New Folder
                </button>
                <div className="context-menu-divider" />
              </>
            )}
            <button
              className="context-menu-item"
              onClick={() => handleRename(contextMenu.path)}
            >
              ✏️ Rename
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleCopy(contextMenu.path)}
            >
              📋 Copy
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleCut(contextMenu.path)}
            >
              ✂️ Cut
            </button>
            {clipboard && contextMenu.isDirectory && (
              <button
                className="context-menu-item"
                onClick={() => handlePaste(contextMenu.path)}
              >
                📌 Paste
              </button>
            )}
            <div className="context-menu-divider" />
            <button
              className="context-menu-item danger"
              onClick={() => handleDeleteFile(contextMenu.path)}
            >
              🗑️ Delete
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


