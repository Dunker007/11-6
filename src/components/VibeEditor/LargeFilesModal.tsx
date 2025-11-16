import { useState, useMemo } from 'react';
import { X, Trash2, FolderOpen, ArrowUpDown } from 'lucide-react';
import { formatBytes, formatDate } from '@/utils/formatters';
import '@/styles/LargeFilesModal.css';

export interface LargeFile {
  path: string;
  size: number;
  lastModified: Date;
}

interface LargeFilesModalProps {
  isOpen: boolean;
  files: LargeFile[];
  onClose: () => void;
  onDelete?: (path: string) => void;
  onOpenLocation?: (path: string) => void;
}

type SortField = 'path' | 'size' | 'lastModified';
type SortDirection = 'asc' | 'desc';

function LargeFilesModal({ isOpen, files, onClose, onDelete, onOpenLocation }: LargeFilesModalProps) {
  const [sortField, setSortField] = useState<SortField>('size');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'path':
          comparison = a.path.localeCompare(b.path);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'lastModified':
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [files, sortField, sortDirection]);

  const totalSize = useMemo(() => {
    return files.reduce((sum, file) => sum + file.size, 0);
  }, [files]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.path)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) return;
    
    const count = selectedFiles.size;
    const confirmMessage = `Delete ${count} file${count > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      selectedFiles.forEach((path) => {
        onDelete?.(path);
      });
      setSelectedFiles(new Set());
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <ArrowUpDown 
        size={12} 
        className={`sort-icon ${sortDirection === 'asc' ? 'asc' : 'desc'}`}
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="large-files-modal-overlay" onClick={onClose}>
      <div className="large-files-modal" onClick={(e) => e.stopPropagation()}>
        <div className="large-files-modal-header">
          <div>
            <h2>Large Files</h2>
            <p className="large-files-summary">
              Found {files.length} file{files.length !== 1 ? 's' : ''} ({formatBytes(totalSize)} total)
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {files.length === 0 ? (
          <div className="large-files-empty">
            <p>No large files found in the selected directory.</p>
          </div>
        ) : (
          <>
            <div className="large-files-toolbar">
              <button
                className="select-all-button"
                onClick={handleSelectAll}
              >
                {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedFiles.size > 0 && (
                <button
                  className="delete-selected-button"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 size={14} />
                  Delete Selected ({selectedFiles.size})
                </button>
              )}
            </div>

            <div className="large-files-table-container">
              <table className="large-files-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === files.length && files.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('path')}
                    >
                      Path
                      <SortIcon field="path" />
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('size')}
                    >
                      Size
                      <SortIcon field="size" />
                    </th>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('lastModified')}
                    >
                      Last Modified
                      <SortIcon field="lastModified" />
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiles.map((file) => (
                    <tr key={file.path} className={selectedFiles.has(file.path) ? 'selected' : ''}>
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.path)}
                          onChange={() => handleSelectFile(file.path)}
                        />
                      </td>
                      <td className="path-cell" title={file.path}>
                        {file.path}
                      </td>
                      <td className="size-cell">{formatBytes(file.size)}</td>
                      <td className="date-cell">{formatDate(file.lastModified, 'datetime')}</td>
                      <td className="actions-cell">
                        <div className="file-actions">
                          {onOpenLocation && (
                            <button
                              className="action-button"
                              onClick={() => onOpenLocation(file.path)}
                              title="Open file location"
                            >
                              <FolderOpen size={14} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              className="action-button delete"
                              onClick={() => {
                                if (confirm(`Delete ${file.path.split('/').pop() || file.path}?`)) {
                                  onDelete(file.path);
                                }
                              }}
                              title="Delete file"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="large-files-modal-footer">
          <button className="close-footer-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LargeFilesModal;

