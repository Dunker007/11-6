/**
 * MergeConflictResolver.tsx
 * 
 * PURPOSE:
 * Component for resolving Git merge conflicts. Displays 3-way merge view
 * with options to accept ours, theirs, or manually edit the resolution.
 * 
 * ARCHITECTURE:
 * React component that uses mergeConflictService:
 * - mergeConflictService: Conflict detection and resolution
 * - Monaco Editor: For viewing and editing conflicts
 * - 3-way merge view: Base, ours, theirs
 * 
 * Features:
 * - 3-way merge view
 * - Accept ours/theirs buttons
 * - Manual resolution editor
 * - Conflict file list
 * - Preview resolved result
 * 
 * CURRENT STATUS:
 * ✅ Conflict display
 * ✅ Resolution options
 * ✅ Manual editing
 * 
 * DEPENDENCIES:
 * - mergeConflictService: Conflict operations
 * - gitDiffService: Diff operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import MergeConflictResolver from '@/components/GitHub/MergeConflictResolver';
 * 
 * <MergeConflictResolver
 *   repoPath="/path/to/repo"
 *   onResolved={() => console.log('Resolved!')}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { mergeConflictService, type ConflictFile, type ConflictMarker } from '@/services/git/mergeConflictService';
import { DiffEditor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { 
  GitMerge, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  X,
  AlertTriangle
} from 'lucide-react';
import '../../styles/MergeConflictResolver.css';

export interface MergeConflictResolverProps {
  repoPath: string;
  onResolved?: () => void;
  onClose?: () => void;
}

function MergeConflictResolver({ repoPath, onResolved, onClose }: MergeConflictResolverProps) {
  const [conflictFiles, setConflictFiles] = useState<ConflictFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ConflictFile | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<ConflictMarker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedContent, setResolvedContent] = useState<string>('');

  useEffect(() => {
    loadConflicts();
  }, [repoPath]);

  useEffect(() => {
    if (selectedFile) {
      setResolvedContent(selectedFile.content);
      if (selectedFile.conflicts.length > 0) {
        setSelectedConflict(selectedFile.conflicts[0]);
      }
    }
  }, [selectedFile]);

  const loadConflicts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const conflicts = await mergeConflictService.getConflicts(repoPath);
      setConflictFiles(conflicts);
      if (conflicts.length > 0) {
        setSelectedFile(conflicts[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveOurs = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const result = await mergeConflictService.resolveOurs(repoPath, selectedFile.path);
      if (result.success) {
        await loadConflicts();
        if (conflictFiles.length === 1) {
          onResolved?.();
        }
      } else {
        setError(result.error || 'Failed to resolve conflict');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveTheirs = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const result = await mergeConflictService.resolveTheirs(repoPath, selectedFile.path);
      if (result.success) {
        await loadConflicts();
        if (conflictFiles.length === 1) {
          onResolved?.();
        }
      } else {
        setError(result.error || 'Failed to resolve conflict');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveManual = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      const result = await mergeConflictService.resolveManual(
        repoPath,
        selectedFile.path,
        resolvedContent
      );
      if (result.success) {
        await loadConflicts();
        if (conflictFiles.length === 1) {
          onResolved?.();
        }
      } else {
        setError(result.error || 'Failed to resolve conflict');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const replaceConflictInContent = (content: string, conflict: ConflictMarker, replacement: string): string => {
    const lines = content.split('\n');
    const before = lines.slice(0, conflict.startLine - 1).join('\n');
    const after = lines.slice(conflict.endLine).join('\n');
    
    return [before, replacement, after].filter(Boolean).join('\n');
  };

  const handleAcceptOurs = () => {
    if (!selectedConflict || !selectedFile) return;
    const newContent = replaceConflictInContent(
      resolvedContent,
      selectedConflict,
      selectedConflict.ours.content
    );
    setResolvedContent(newContent);
  };

  const handleAcceptTheirs = () => {
    if (!selectedConflict || !selectedFile) return;
    const newContent = replaceConflictInContent(
      resolvedContent,
      selectedConflict,
      selectedConflict.theirs.content
    );
    setResolvedContent(newContent);
  };

  if (isLoading && conflictFiles.length === 0) {
    return (
      <div className="merge-conflict-resolver">
        <div className="loading-state">
          <RefreshCw size={24} className="spinning" />
          <span>Loading conflicts...</span>
        </div>
      </div>
    );
  }

  if (conflictFiles.length === 0) {
    return (
      <div className="merge-conflict-resolver">
        <div className="empty-state">
          <CheckCircle size={48} className="success-icon" />
          <p>No merge conflicts found</p>
          {onClose && (
            <button onClick={onClose} className="close-btn">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="merge-conflict-resolver">
      <div className="resolver-header">
        <div className="header-left">
          <GitMerge size={20} />
          <h2>Merge Conflicts</h2>
          <span className="conflict-count">{conflictFiles.length} file(s)</span>
        </div>
        <div className="header-actions">
          <button onClick={loadConflicts} className="refresh-btn" disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
          {onClose && (
            <button onClick={onClose} className="close-btn">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="resolver-content">
        <div className="conflict-files-panel">
          <h3>Conflicted Files</h3>
          <div className="files-list">
            {conflictFiles.map((file) => (
              <div
                key={file.path}
                className={`file-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                onClick={() => setSelectedFile(file)}
              >
                <FileText size={14} />
                <span className="file-name">{file.path}</span>
                <span className="conflict-count-badge">{file.conflicts.length}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedFile && (
          <div className="conflict-editor-panel">
            <div className="editor-header">
              <h3>{selectedFile.path}</h3>
              <div className="conflict-navigation">
                {selectedFile.conflicts.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const index = selectedFile.conflicts.indexOf(selectedConflict!);
                        if (index > 0) {
                          setSelectedConflict(selectedFile.conflicts[index - 1]);
                        }
                      }}
                      disabled={selectedFile.conflicts.indexOf(selectedConflict!) === 0}
                      className="nav-btn"
                    >
                      <ArrowLeft size={14} />
                      Previous
                    </button>
                    <span className="conflict-index">
                      {selectedFile.conflicts.indexOf(selectedConflict!) + 1} / {selectedFile.conflicts.length}
                    </span>
                    <button
                      onClick={() => {
                        const index = selectedFile.conflicts.indexOf(selectedConflict!);
                        if (index < selectedFile.conflicts.length - 1) {
                          setSelectedConflict(selectedFile.conflicts[index + 1]);
                        }
                      }}
                      disabled={selectedFile.conflicts.indexOf(selectedConflict!) === selectedFile.conflicts.length - 1}
                      className="nav-btn"
                    >
                      Next
                      <ArrowRight size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {selectedConflict && (
              <div className="conflict-resolution-options">
                <div className="resolution-buttons">
                  <button onClick={handleAcceptOurs} className="resolve-btn ours">
                    Accept Ours
                  </button>
                  <button onClick={handleAcceptTheirs} className="resolve-btn theirs">
                    Accept Theirs
                  </button>
                </div>
              </div>
            )}

            <div className="editor-container">
              <DiffEditor
                height="100%"
                language="typescript"
                original={selectedFile.content}
                modified={resolvedContent}
                onChange={(value) => {
                  if (value) {
                    setResolvedContent(value);
                  }
                }}
                options={{
                  readOnly: false,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                }}
              />
            </div>

            <div className="resolver-actions">
              <button
                onClick={handleResolveOurs}
                className="action-btn ours"
                disabled={isLoading}
              >
                Accept All Ours
              </button>
              <button
                onClick={handleResolveTheirs}
                className="action-btn theirs"
                disabled={isLoading}
              >
                Accept All Theirs
              </button>
              <button
                onClick={handleResolveManual}
                className="action-btn primary"
                disabled={isLoading || resolvedContent === selectedFile.content}
              >
                Resolve Manually
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MergeConflictResolver;

