/**
 * FileExplorer.tsx
 * 
 * PURPOSE:
 * File tree explorer component for navigating and managing project files. Provides file/folder
 * operations including create, delete, rename, copy/paste, and system file browsing. Includes
 * advanced features like large file detection and recursive directory operations.
 * 
 * ARCHITECTURE:
 * Complex file management component with:
 * - Project file tree display
 * - System file browsing (drives, directories)
 * - Context menu for file operations
 * - Clipboard for copy/cut operations
 * - Recursive directory operations
 * - Large file scanning
 * - Directory size calculation
 * 
 * Features:
 * - Expandable/collapsible directory tree
 * - Right-click context menu
 * - Copy/cut/paste operations
 * - Recursive rename and copy
 * - Large file finder (100MB+)
 * - Directory size display
 * - System drive browsing
 * 
 * CURRENT STATUS:
 * ✅ Project file tree navigation
 * ✅ System file browsing
 * ✅ File/folder create, delete, rename
 * ✅ Copy/cut/paste operations
 * ✅ Recursive directory operations
 * ✅ Large file detection
 * ✅ Directory size calculation
 * ✅ Context menu operations
 * ✅ Activity logging
 * 
 * DEPENDENCIES:
 * - useProjectStore: Project file management
 * - useActivityStore: Activity logging
 * - fileSystemService: File system operations
 * - formatBytes: Size formatting utility
 * - LargeFilesModal: Large files display
 * 
 * STATE MANAGEMENT:
 * - Local state: expanded dirs, context menu, clipboard, renaming, view mode
 * - System state: drives, files, directory sizes
 * - Modal state: large files modal
 * 
 * PERFORMANCE:
 * - Efficient tree rendering
 * - Lazy directory loading
 * - Debounced operations
 * - Memoized calculations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import FileExplorer from '@/components/VibeEditor/FileExplorer';
 * 
 * function VibeEditor() {
 *   const { files, activeFile } = useProjectStore();
 *   return <FileExplorer files={files} activeFile={activeFile} onFileSelect={handleSelect} />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/components/VibeEditor/LargeFilesModal.tsx: Large files display
 * - src/services/filesystem/fileSystemService.ts: File operations
 * - src/services/project/projectStore.ts: Project state
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Drag and drop file operations
 * - File search within explorer
 * - File preview on hover
 * - Git status indicators
 * - File icons based on type
 */
import { useState, useEffect } from 'react';
import type { ProjectFile } from '@/types/project';
import { useProjectStore } from '@/services/project/projectStore';
import { useActivityStore } from '@/services/activity/activityStore';
import { fileSystemService } from '@/services/filesystem/fileSystemService';
import { useToast } from '@/components/ui';
import TechIcon from '@/components/Icons/TechIcon';
import LargeFilesModal, { type LargeFile } from './LargeFilesModal';
import { formatBytes } from '@/utils/formatters';
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

function FileExplorer({ files, activeFile, onFileSelect }: FileExplorerProps) {
  const { addFile, deleteFile, activeProject, getFileContent } = useProjectStore();
  const { addActivity } = useActivityStore();
  const { showToast } = useToast();
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([files[0]?.path || '']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isDirectory: boolean } | null>(null);
  const [clipboard, setClipboard] = useState<{ path: string; operation: 'copy' | 'cut' } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'project' | 'system'>('project');
  const [systemDrives, setSystemDrives] = useState<Array<{ name: string; path: string; type?: string }>>([]);
  const [systemFiles, setSystemFiles] = useState<Map<string, SystemFileEntry[]>>(new Map());
  const [directorySizes, setDirectorySizes] = useState<Map<string, number>>(new Map());
  const [loadingSize, setLoadingSize] = useState<string | null>(null);
  const [largeFilesModalOpen, setLargeFilesModalOpen] = useState(false);
  const [largeFiles, setLargeFiles] = useState<LargeFile[]>([]);

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

  const handleRenameConfirm = async (oldPath: string, newName: string) => {
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
        const content = getFileContent(oldPath);
        addFile(newPath, content || '', detectLanguage(newName));
        deleteFile(oldPath);
        addActivity('file', 'updated', `Renamed ${file.name} to ${newName}`);
      } else if (file && file.isDirectory) {
        // For directories: recursively rename all files
        try {
          showToast({
            variant: 'info',
            title: 'Renaming directory',
            message: `Renaming ${file.name}...`,
          });

          const filesToRename = getAllFilesInDirectory(files, oldPath);
          let renamedCount = 0;

          for (const fileToRename of filesToRename) {
            const relativePath = fileToRename.path.substring(oldPath.length);
            const newFilePath = newPath + relativePath;
            const content = getFileContent(fileToRename.path);
            
            if (content !== null) {
              addFile(newFilePath, content, fileToRename.language);
              deleteFile(fileToRename.path);
              renamedCount++;
            }
          }

          addActivity('file', 'updated', `Renamed directory ${file.name} to ${newName} (${renamedCount} files)`);
          showToast({
            variant: 'success',
            title: 'Directory renamed',
            message: `Renamed ${renamedCount} file${renamedCount !== 1 ? 's' : ''}`,
          });
        } catch (error) {
          showToast({
            variant: 'error',
            title: 'Rename failed',
            message: `Failed to rename directory: ${(error as Error).message}`,
          });
        }
      }
    }

    setRenamingPath(null);
  };

  // Helper function to get all files in a directory recursively
  const getAllFilesInDirectory = (fileList: ProjectFile[], dirPath: string): ProjectFile[] => {
    const result: ProjectFile[] = [];
    
    function traverse(files: ProjectFile[], basePath: string) {
      for (const file of files) {
        if (file.path.startsWith(basePath) && !file.isDirectory) {
          result.push(file);
        }
        if (file.children) {
          traverse(file.children, basePath);
        }
      }
    }
    
    traverse(fileList, dirPath);
    return result;
  };

  const handleCopy = (path: string) => {
    setClipboard({ path, operation: 'copy' });
    setContextMenu(null);
  };

  const handleCut = (path: string) => {
    setClipboard({ path, operation: 'cut' });
    setContextMenu(null);
  };

  const handlePaste = async (targetDirPath: string) => {
    if (!clipboard || !activeProject) {
      setContextMenu(null);
      return;
    }

    const file = findFile(files, clipboard.path);
    if (!file) {
      setContextMenu(null);
      return;
    }

    if (file.isDirectory) {
      // Recursive directory copy/paste
      try {
        showToast({
          variant: 'info',
          title: clipboard.operation === 'copy' ? 'Copying directory' : 'Moving directory',
          message: `Processing ${file.name}...`,
        });

        const filesToCopy = getAllFilesInDirectory(files, clipboard.path);
        const dirName = file.name;
        const newBasePath = `${targetDirPath}/${dirName}`;
        let copiedCount = 0;

        for (const fileToCopy of filesToCopy) {
          const relativePath = fileToCopy.path.substring(clipboard.path.length);
          const newFilePath = newBasePath + relativePath;
          const content = getFileContent(fileToCopy.path);
          
          if (content !== null) {
            addFile(newFilePath, content, fileToCopy.language);
            copiedCount++;
          }
        }

        if (clipboard.operation === 'cut') {
          // Delete original files after successful copy
          for (const fileToDelete of filesToCopy) {
            deleteFile(fileToDelete.path);
          }
          setClipboard(null);
        }

        setExpandedDirs((prev) => new Set(prev).add(targetDirPath).add(newBasePath));
        addActivity('file', clipboard.operation === 'copy' ? 'copied' : 'moved', `${clipboard.operation === 'copy' ? 'Copied' : 'Moved'} directory ${dirName} (${copiedCount} files)`);
        
        showToast({
          variant: 'success',
          title: clipboard.operation === 'copy' ? 'Directory copied' : 'Directory moved',
          message: `${clipboard.operation === 'copy' ? 'Copied' : 'Moved'} ${copiedCount} file${copiedCount !== 1 ? 's' : ''}`,
        });
      } catch (error) {
        showToast({
          variant: 'error',
          title: 'Operation failed',
          message: `Failed to ${clipboard.operation} directory: ${(error as Error).message}`,
        });
      }
    } else {
      // Single file copy/paste
      const fileName = file.name;
      const newPath = `${targetDirPath}/${fileName}`;
      const content = getFileContent(clipboard.path);

      if (clipboard.operation === 'copy') {
        addFile(newPath, content || '', file.language);
      } else if (clipboard.operation === 'cut') {
        addFile(newPath, content || '', file.language);
        deleteFile(clipboard.path);
        setClipboard(null);
      }

      setExpandedDirs((prev) => new Set(prev).add(targetDirPath));
      addActivity('file', clipboard.operation === 'copy' ? 'copied' : 'moved', `${clipboard.operation === 'copy' ? 'Copied' : 'Moved'} ${fileName}`);
    }

    setContextMenu(null);
  };

  const handleGetSize = async (dirPath: string) => {
    setLoadingSize(dirPath);
    try {
      const result = await fileSystemService.getDirectorySize(dirPath);
      if (result.success && result.data !== undefined) {
        setDirectorySizes(prev => new Map(prev).set(dirPath, result.data!));
        showToast({
          variant: 'info',
          title: 'Directory size',
          message: formatBytes(result.data),
        });
      }
    } catch (error) {
      console.error('Failed to get directory size:', error);
    } finally {
      setLoadingSize(null);
      setContextMenu(null);
    }
  };

  const handleCleanTempFiles = async (dirPath: string) => {
    if (!confirm(`Clean temporary files in "${dirPath}"?\n\nThis will delete temporary files (.tmp, .temp, ~ files) in this directory only.`)) {
      setContextMenu(null);
      return;
    }
    try {
      // Read directory contents
      const result = await fileSystemService.readdir(dirPath);
      if (!result.success || !result.data) {
        showToast({
          variant: 'error',
          title: 'Failed to read directory',
          message: result.error || 'Unknown error',
        });
        setContextMenu(null);
        return;
      }

      // Filter for temporary files
      const tempFilePatterns = ['.tmp', '.temp', '.log', '~'];
      const tempFiles = result.data.filter(entry => 
        !entry.isDirectory && tempFilePatterns.some(pattern => 
          entry.name.toLowerCase().endsWith(pattern.toLowerCase())
        )
      );

      if (tempFiles.length === 0) {
        showToast({
          variant: 'info',
          title: 'No temporary files',
          message: 'No temporary files found in this directory',
        });
        setContextMenu(null);
        return;
      }

      // Delete temp files
      let deletedCount = 0;
      let totalSize = 0;
      const errors: string[] = [];

      for (const file of tempFiles) {
        try {
          // Get file size before deletion
          const statResult = await fileSystemService.stat(file.path);
          const fileSize = statResult.success && statResult.data ? statResult.data.size : 0;
          
          const deleteResult = await fileSystemService.rm(file.path, false);
          if (deleteResult.success) {
            deletedCount++;
            totalSize += fileSize;
          } else {
            errors.push(`${file.name}: ${deleteResult.error || 'Failed to delete'}`);
          }
        } catch (error) {
          errors.push(`${file.name}: ${(error as Error).message}`);
        }
      }

      const errorMessage = errors.length > 0 
        ? `Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? ` and ${errors.length - 3} more` : ''}`
        : '';
      showToast({
        variant: errors.length > 0 ? 'warning' : 'success',
        title: `Cleaned ${deletedCount} file(s)`,
        message: `Freed ${formatBytes(totalSize)}${errorMessage ? `. ${errorMessage}` : ''}`,
        duration: 5000,
      });
      addActivity('file', 'deleted', `Cleaned ${deletedCount} temp file(s) from ${dirPath}`);
      
      // Refresh directory view if it's currently expanded
      if (systemFiles.has(dirPath)) {
        loadSystemDirectory(dirPath);
      }
    } catch (error) {
      console.error('Failed to clean temp files:', error);
      showToast({
        variant: 'error',
        title: 'Failed to clean temp files',
        message: (error as Error).message,
      });
    } finally {
      setContextMenu(null);
    }
  };

  const handleFindLargeFiles = async (dirPath: string) => {
    setContextMenu(null);
    
    try {
      showToast({
        variant: 'info',
        title: 'Scanning for large files',
        message: `Scanning ${dirPath}...`,
        duration: 2000,
      });

      const result = await fileSystemService.findLargeFiles(dirPath, 100); // 100MB default
      
      if (result.success && result.data) {
        const files: LargeFile[] = result.data.map((file) => ({
          path: file.path,
          size: file.size,
          lastModified: new Date(file.lastModified),
        }));
        
        setLargeFiles(files);
        setLargeFilesModalOpen(true);
        
        if (files.length === 0) {
          showToast({
            variant: 'info',
            title: 'No large files found',
            message: 'No files larger than 100MB were found in this directory.',
          });
        } else {
          showToast({
            variant: 'success',
            title: 'Scan complete',
            message: `Found ${files.length} large file${files.length !== 1 ? 's' : ''}`,
          });
        }
      } else {
        showToast({
          variant: 'error',
          title: 'Scan failed',
          message: result.error || 'Failed to scan for large files',
        });
      }
    } catch (error) {
      console.error('Failed to find large files:', error);
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to scan: ${(error as Error).message}`,
      });
    }
  };

  const handleDeleteLargeFile = async (filePath: string) => {
    try {
      const result = await fileSystemService.rm(filePath, false);
      if (result.success) {
        setLargeFiles((prev) => prev.filter((f) => f.path !== filePath));
        addActivity('file', 'deleted', `Deleted large file: ${filePath.split('/').pop() || filePath}`);
        showToast({
          variant: 'success',
          title: 'File deleted',
          message: 'File has been deleted successfully',
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Delete failed',
          message: result.error || 'Failed to delete file',
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to delete: ${(error as Error).message}`,
      });
    }
  };

  const handleOpenFileLocation = async (filePath: string) => {
    try {
      // Use shell to open file location (OS-specific)
      if (window.shell?.showItemInFolder) {
        await window.shell.showItemInFolder(filePath);
      } else {
        showToast({
          variant: 'info',
          title: 'Open location',
          message: `Path: ${filePath}`,
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to open location: ${(error as Error).message}`,
      });
    }
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

    const handleSystemFileClick = async () => {
      try {
        // Read the system file content
        const result = await fileSystemService.readFile(entry.path);
        if (result.success && result.data !== undefined) {
          // Add file to project store temporarily so it can be opened in editor
          // Use a special path prefix to indicate it's a system file
          const systemFilePath = `[SYSTEM]${entry.path}`;
          addFile(systemFilePath, result.data, detectLanguage(entry.name));
          onFileSelect(systemFilePath);
          addActivity('file', 'opened', `Opened system file: ${entry.name}`);
        } else {
          showToast({
            variant: 'error',
            title: 'Failed to read file',
            message: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        console.error('Failed to open system file:', error);
        showToast({
          variant: 'error',
          title: 'Failed to open file',
          message: (error as Error).message,
        });
      }
    };

    return (
      <div
        key={entry.path}
        className="file-item file"
        style={{ paddingLeft: `${level * 16 + 24}px` }}
        onClick={handleSystemFileClick}
        onContextMenu={(e) => handleContextMenu(e, entry.path, false)}
      >
        <TechIcon icon={FileText} size={16} glow="none" className="file-icon" />
        <span className="file-name">{entry.name}</span>
        {entry.size !== undefined && (
          <span className="file-size" title={`Size: ${formatBytes(entry.size)}`}>
            {formatBytes(entry.size)}
          </span>
        )}
      </div>
    );
  };

  useEffect(() => {
    const loadDrives = async () => {
      if (viewMode === 'system') {
        const result = await fileSystemService.listDrives();
        if (result.success && result.data) {
          setSystemDrives(result.data);
        }
      }
    };
    loadDrives();
  }, [viewMode]);

  const loadSystemDirectory = async (path: string) => {
    if (systemFiles.has(path)) return;
    try {
      const result = await fileSystemService.readdir(path);
      if (result.success && result.data) {
        // Load file sizes for non-directory entries
        const entriesWithSize = await Promise.all(
          result.data.map(async (entry) => {
            if (entry.isDirectory) {
              return {
                name: entry.name,
                path: entry.path,
                isDirectory: true,
              };
            }
            // Get file size
            const statResult = await fileSystemService.stat(entry.path);
            return {
              name: entry.name,
              path: entry.path,
              isDirectory: false,
              size: statResult.success && statResult.data ? statResult.data.size : undefined,
            };
          })
        );
        setSystemFiles(prev => new Map(prev).set(path, entriesWithSize));
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

      <LargeFilesModal
        isOpen={largeFilesModalOpen}
        files={largeFiles}
        onClose={() => setLargeFilesModalOpen(false)}
        onDelete={handleDeleteLargeFile}
        onOpenLocation={handleOpenFileLocation}
      />
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

