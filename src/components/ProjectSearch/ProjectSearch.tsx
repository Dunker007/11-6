import { useState, useEffect } from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import type { ProjectFile } from '@/types/project';
import '../../styles/ProjectSearch.css';

interface SearchResult {
  filePath: string;
  fileName: string;
  line: number;
  lineText: string;
  matchIndex: number;
}

interface ProjectSearchProps {
  onClose: () => void;
  onFileSelect: (path: string, line?: number) => void;
}

function ProjectSearch({ onClose, onFileSelect }: ProjectSearchProps) {
  const { activeProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  useEffect(() => {
    const searchFiles = () => {
      if (!searchQuery.trim() || !activeProject) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const foundResults: SearchResult[] = [];

      const searchInFile = (file: ProjectFile) => {
        if (file.isDirectory && file.children) {
          file.children.forEach(searchInFile);
        } else if (!file.isDirectory && file.content) {
          const lines = file.content.split('\n');
          lines.forEach((lineText, index) => {
            let hasMatch = false;
            
            if (useRegex) {
              try {
                const regex = new RegExp(searchQuery, caseSensitive ? 'g' : 'gi');
                hasMatch = regex.test(lineText);
              } catch {
                // Invalid regex, fallback to plain text
                hasMatch = caseSensitive
                  ? lineText.includes(searchQuery)
                  : lineText.toLowerCase().includes(searchQuery.toLowerCase());
              }
            } else {
              hasMatch = caseSensitive
                ? lineText.includes(searchQuery)
                : lineText.toLowerCase().includes(searchQuery.toLowerCase());
            }

            if (hasMatch) {
              const matchIndex = caseSensitive
                ? lineText.indexOf(searchQuery)
                : lineText.toLowerCase().indexOf(searchQuery.toLowerCase());

              foundResults.push({
                filePath: file.path,
                fileName: file.name,
                line: index + 1,
                lineText: lineText.trim(),
                matchIndex,
              });
            }
          });
        }
      };

      activeProject.files.forEach(searchInFile);
      setResults(foundResults);
      setIsSearching(false);
    };

    const debounce = setTimeout(searchFiles, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeProject, caseSensitive, useRegex]);

  const highlightMatch = (text: string, query: string, matchIndex: number) => {
    if (matchIndex === -1) return text;
    
    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + query.length);
    const after = text.substring(matchIndex + query.length);

    return (
      <>
        {before}
        <span className="search-highlight">{match}</span>
        {after}
      </>
    );
  };

  return (
    <div className="project-search-overlay" onClick={onClose}>
      <div className="project-search-container" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <h3>Search in Project</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="search-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="search-options">
            <label className="search-option">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              <span>Case Sensitive (Aa)</span>
            </label>
            <label className="search-option">
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              <span>Use Regex (.*)</span>
            </label>
          </div>
        </div>

        <div className="search-results">
          {isSearching && <div className="search-status">Searching...</div>}
          {!isSearching && searchQuery && results.length === 0 && (
            <div className="search-status">No results found</div>
          )}
          {!isSearching && results.length > 0 && (
            <>
              <div className="results-count">
                {results.length} result{results.length !== 1 ? 's' : ''} in{' '}
                {new Set(results.map((r) => r.filePath)).size} file(s)
              </div>
              <div className="results-list">
                {results.map((result, index) => (
                  <div
                    key={`${result.filePath}-${result.line}-${index}`}
                    className="result-item"
                    onClick={() => {
                      onFileSelect(result.filePath, result.line);
                      onClose();
                    }}
                  >
                    <div className="result-header">
                      <span className="result-file">{result.fileName}</span>
                      <span className="result-line">:{result.line}</span>
                    </div>
                    <div className="result-content">
                      {highlightMatch(result.lineText, searchQuery, result.matchIndex)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectSearch;

