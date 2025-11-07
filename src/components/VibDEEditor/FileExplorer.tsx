import { useState } from 'react';
import type { ProjectFile } from '@/types/project';
import { useProjectStore } from '../../services/project/projectStore';
import '../styles/FileExplorer.css';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}

function FileExplorer({ files, activeFile, onFileSelect }: FileExplorerProps) {
  const { addFile, deleteFile } = useProjectStore();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([files[0]?.path || '']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

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

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  const handleNewFile = (dirPath: string) => {
    const fileName = prompt('File name:');
    if (fileName) {
      const fullPath = `${dirPath}/${fileName}`;
      addFile(fullPath, '', detectLanguage(fileName));
      setExpandedDirs((prev) => new Set(prev).add(dirPath));
    }
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

    if (file.isDirectory) {
      return (
        <div key={file.path}>
          <div
            className={`file-item directory ${isExpanded ? 'expanded' : ''}`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => toggleDir(file.path)}
            onContextMenu={(e) => handleContextMenu(e, file.path)}
          >
            <span className="file-icon">{isExpanded ? '📂' : '📁'}</span>
            <span className="file-name">{file.name}</span>
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
        onClick={() => onFileSelect(file.path)}
        onContextMenu={(e) => handleContextMenu(e, file.path)}
      >
        <span className="file-icon">📄</span>
        <span className="file-name">{file.name}</span>
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
          +
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
            <button
              className="context-menu-item"
              onClick={() => {
                const file = findFile(files, contextMenu.path);
                if (file?.isDirectory) {
                  handleNewFile(contextMenu.path);
                }
              }}
            >
              New File
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleDeleteFile(contextMenu.path)}
            >
              Delete
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

