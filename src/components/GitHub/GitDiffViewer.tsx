/**
 * GitDiffViewer.tsx
 * 
 * PURPOSE:
 * Visual diff viewer component using Monaco Editor's built-in diff editor.
 * Displays side-by-side comparison of file changes with syntax highlighting.
 * 
 * ARCHITECTURE:
 * React component that uses Monaco Editor DiffEditor:
 * - gitDiffService: Retrieves diff content
 * - Monaco DiffEditor: Displays side-by-side diff
 * - File selection: Choose which file to view diff for
 * 
 * Features:
 * - Side-by-side diff view
 * - Syntax highlighting
 * - Line-by-line navigation
 * - File tree navigation
 * - Diff statistics display
 * - Toggle between unified and side-by-side view
 * 
 * CURRENT STATUS:
 * ✅ Side-by-side diff display
 * ✅ File selection
 * ✅ Syntax highlighting
 * ✅ Diff statistics
 * 
 * DEPENDENCIES:
 * - @monaco-editor/react: Monaco Editor React wrapper
 * - gitDiffService: Git diff operations
 * - VibeDSTheme: Editor theme
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import GitDiffViewer from '@/components/GitHub/GitDiffViewer';
 * 
 * <GitDiffViewer
 *   repoPath="/path/to/repo"
 *   filePath="src/file.ts"
 *   base="HEAD"
 * />
 * ```
 * 
 * RELATED FILES:
 * - src/services/git/gitDiffService.ts: Diff service
 * - src/services/github/githubService.ts: Related Git operations
 */

import { useState, useEffect, useMemo } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { gitDiffService, type FileDiff } from '@/services/git/gitDiffService';
import { VibeDSTheme } from '@/services/theme/VibeDSEditorTheme';
import { FileText, ChevronLeft, ChevronRight, RefreshCw, X, GitBranch, GitCommit } from 'lucide-react';
import '../../styles/GitDiffViewer.css';

export interface GitDiffViewerProps {
  repoPath: string;
  filePath?: string;
  base?: string;
  onClose?: () => void;
  onFileSelect?: (filePath: string) => void;
}

function GitDiffViewer({
  repoPath,
  filePath: initialFilePath,
  base = 'HEAD',
  onClose,
  onFileSelect,
}: GitDiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(initialFilePath || null);
  const [fileDiff, setFileDiff] = useState<FileDiff | null>(null);
  const [changedFiles, setChangedFiles] = useState<Array<{ path: string; status: 'modified' | 'added' | 'deleted' | 'renamed' }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Load changed files on mount
  useEffect(() => {
    loadChangedFiles();
  }, [repoPath, base]);

  // Load diff when file is selected
  useEffect(() => {
    if (selectedFile) {
      loadFileDiff(selectedFile);
    }
  }, [selectedFile, repoPath, base]);

  // Set initial file index when changed files load
  useEffect(() => {
    if (changedFiles.length > 0 && initialFilePath) {
      const index = changedFiles.findIndex(f => f.path === initialFilePath);
      if (index >= 0) {
        setCurrentFileIndex(index);
        setSelectedFile(initialFilePath);
      } else {
        setCurrentFileIndex(0);
        setSelectedFile(changedFiles[0]?.path || null);
      }
    } else if (changedFiles.length > 0 && !selectedFile) {
      setCurrentFileIndex(0);
      setSelectedFile(changedFiles[0]?.path || null);
    }
  }, [changedFiles, initialFilePath]);

  const loadChangedFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const files = await gitDiffService.getChangedFiles(repoPath, base);
      setChangedFiles(files);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFileDiff = async (file: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const diff = await gitDiffService.getFileDiff(repoPath, file, { base });
      if (diff) {
        setFileDiff(diff);
        onFileSelect?.(file);
      } else {
        setError('No changes found for this file');
        setFileDiff(null);
      }
    } catch (err) {
      setError((err as Error).message);
      setFileDiff(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: string) => {
    setSelectedFile(file);
    const index = changedFiles.findIndex(f => f.path === file);
    if (index >= 0) {
      setCurrentFileIndex(index);
    }
  };

  const handlePreviousFile = () => {
    if (currentFileIndex > 0) {
      const newIndex = currentFileIndex - 1;
      setCurrentFileIndex(newIndex);
      setSelectedFile(changedFiles[newIndex].path);
    }
  };

  const handleNextFile = () => {
    if (currentFileIndex < changedFiles.length - 1) {
      const newIndex = currentFileIndex + 1;
      setCurrentFileIndex(newIndex);
      setSelectedFile(changedFiles[newIndex].path);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      json: 'json',
      css: 'css',
      html: 'html',
      md: 'markdown',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      go: 'go',
      rs: 'rust',
      php: 'php',
      rb: 'ruby',
      sh: 'shell',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return langMap[ext] || 'plaintext';
  };

  const language = useMemo(() => {
    return selectedFile ? getLanguageFromPath(selectedFile) : 'plaintext';
  }, [selectedFile]);

  const handleEditorMount = (editor: editor.IDiffEditor, monaco: typeof import('monaco-editor')) => {
    // Define and apply custom theme
    monaco.editor.defineTheme('VibeDSTheme', VibeDSTheme);
    monaco.editor.setTheme('VibeDSTheme');
  };

  return (
    <div className="git-diff-viewer">
      <div className="diff-viewer-header">
        <div className="header-left">
          <h3>Git Diff Viewer</h3>
          {selectedFile && (
            <div className="file-info">
              <FileText size={16} />
              <span className="file-path">{selectedFile}</span>
              {fileDiff && (
                <div className="diff-stats">
                  <span className="stat-item additions">+{fileDiff.stats.insertions}</span>
                  <span className="stat-item deletions">-{fileDiff.stats.deletions}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="header-right">
          <div className="view-controls">
            <button
              className={`view-mode-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
              title="Side-by-side view"
            >
              Side-by-side
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'inline' ? 'active' : ''}`}
              onClick={() => setViewMode('inline')}
              title="Inline view"
            >
              Inline
            </button>
          </div>
          <button
            className="refresh-btn"
            onClick={loadChangedFiles}
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw size={16} />
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="diff-viewer-content">
        <div className="file-list-panel">
          <div className="file-list-header">
            <h4>Changed Files ({changedFiles.length})</h4>
            <div className="base-info">
              <GitBranch size={14} />
              <span>Base: {base}</span>
            </div>
          </div>
          {isLoading && changedFiles.length === 0 ? (
            <div className="loading-state">Loading files...</div>
          ) : changedFiles.length === 0 ? (
            <div className="empty-state">No changed files</div>
          ) : (
            <div className="file-list">
              {changedFiles.map((file, index) => (
                <div
                  key={file.path}
                  className={`file-item ${selectedFile === file.path ? 'active' : ''} ${file.status}`}
                  onClick={() => handleFileSelect(file.path)}
                >
                  <span className="file-status-icon">
                    {file.status === 'modified' && '●'}
                    {file.status === 'added' && '+'}
                    {file.status === 'deleted' && '−'}
                    {file.status === 'renamed' && '↻'}
                  </span>
                  <span className="file-name" title={file.path}>
                    {file.path.split('/').pop()}
                  </span>
                  <span className="file-path-hint">{file.path}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="diff-editor-panel">
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {isLoading && !fileDiff ? (
            <div className="loading-state">Loading diff...</div>
          ) : fileDiff ? (
            <>
              <div className="diff-navigation">
                <button
                  className="nav-btn"
                  onClick={handlePreviousFile}
                  disabled={currentFileIndex === 0}
                  title="Previous file"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="file-counter">
                  {currentFileIndex + 1} / {changedFiles.length}
                </span>
                <button
                  className="nav-btn"
                  onClick={handleNextFile}
                  disabled={currentFileIndex === changedFiles.length - 1}
                  title="Next file"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="diff-editor-container">
                <DiffEditor
                  height="100%"
                  language={language}
                  original={fileDiff.originalContent}
                  modified={fileDiff.modifiedContent}
                  onMount={handleEditorMount}
                  theme="VibeDSTheme"
                  options={{
                    readOnly: true,
                    renderSideBySide: viewMode === 'side-by-side',
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    automaticLayout: true,
                    wordWrap: 'on',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    fontLigatures: true,
                    scrollBeyondLastLine: false,
                    renderOverviewRuler: true,
                    diffWordWrap: 'on',
                    enableSplitViewResizing: true,
                    ignoreTrimWhitespace: false,
                    renderIndicators: true,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="empty-state">
              {selectedFile ? 'No diff available for this file' : 'Select a file to view diff'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GitDiffViewer;

