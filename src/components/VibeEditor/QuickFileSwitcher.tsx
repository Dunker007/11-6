/**
 * QuickFileSwitcher.tsx
 * 
 * Quick file switcher (Ctrl+P) with fuzzy search.
 * Allows quick navigation to any file in the project.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import { useProjectStore } from '@/services/project/projectStore';
import { useTabStore } from '@/services/editor/tabStore';
import TechIcon from '../Icons/TechIcon';
import { FileText, X, Search } from 'lucide-react';
import '@/styles/QuickFileSwitcher.css';

interface QuickFileSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (path: string) => void;
}

function QuickFileSwitcher({ isOpen, onClose, onFileSelect }: QuickFileSwitcherProps) {
  const { activeProject } = useProjectStore();
  const { openTab, setActiveTab } = useTabStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get all files from project
  const allFiles = useMemo(() => {
    if (!activeProject) return [];
    
    const files: Array<{ path: string; name: string }> = [];
    
    const traverse = (fileList: typeof activeProject.files) => {
      for (const file of fileList) {
        if (!file.isDirectory) {
          files.push({
            path: file.path,
            name: file.name,
          });
        }
        if (file.children) {
          traverse(file.children);
        }
      }
    };
    
    traverse(activeProject.files);
    return files;
  }, [activeProject]);

  // Fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(allFiles, {
      keys: ['name', 'path'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [allFiles]);

  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return allFiles.slice(0, 20); // Show first 20 files when no query
    }
    
    const results = fuse.search(query);
    return results.map(result => result.item);
  }, [query, fuse, allFiles]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        scrollToSelected();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        scrollToSelected();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleFileSelect(searchResults[selectedIndex].path);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const scrollToSelected = () => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleFileSelect = (path: string) => {
    const tabId = openTab(path);
    setActiveTab(tabId);
    
    if (onFileSelect) {
      onFileSelect(path);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="quick-file-switcher-overlay" onClick={onClose}>
      <div className="quick-file-switcher" onClick={(e) => e.stopPropagation()}>
        <div className="quick-file-switcher-header">
          <TechIcon icon={Search} size={18} glow="none" />
          <input
            ref={inputRef}
            type="text"
            className="quick-file-switcher-input"
            placeholder="Search files... (Ctrl+P)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="quick-file-switcher-close"
            onClick={onClose}
            title="Close (Esc)"
          >
            <TechIcon icon={X} size={16} glow="none" />
          </button>
        </div>
        
        <div className="quick-file-switcher-results" ref={resultsRef}>
          {searchResults.length === 0 ? (
            <div className="quick-file-switcher-empty">
              <p>No files found</p>
            </div>
          ) : (
            searchResults.map((file, index) => (
              <div
                key={file.path}
                className={`quick-file-switcher-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleFileSelect(file.path)}
              >
                <TechIcon icon={FileText} size={16} glow="none" />
                <div className="quick-file-switcher-item-content">
                  <div className="quick-file-switcher-item-name">{file.name}</div>
                  <div className="quick-file-switcher-item-path">{file.path}</div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="quick-file-switcher-footer">
          <span className="quick-file-switcher-hint">↑↓ Navigate</span>
          <span className="quick-file-switcher-hint">Enter Open</span>
          <span className="quick-file-switcher-hint">Esc Close</span>
        </div>
      </div>
    </div>
  );
}

export default QuickFileSwitcher;

