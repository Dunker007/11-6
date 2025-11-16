import { useState, useEffect } from 'react';
import { useProjectStore } from '@/services/project/projectStore';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { semanticIndexService } from '@/services/ai/semanticIndexService';
import type { ProjectFile } from '@/types/project';
import type { SemanticSearchResult } from '@/types/semantic';
import '@/styles/ProjectSearch.css';

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
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Semantic search handler
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || !activeProject) {
      setSemanticResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const semanticResults = await semanticIndexService.search(searchQuery, 20);
      setSemanticResults(semanticResults);
    } catch (error) {
      console.error('Semantic search failed:', error);
      setSemanticResults([]);
      // Don't show error toast, just log it
    } finally {
      setIsSearching(false);
    }
  };

  // Keyword search effect
  useEffect(() => {
    if (searchMode !== 'keyword') {
      setResults([]);
      return;
    }

    if (!debouncedSearchQuery.trim() || !activeProject) {
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
              const regex = new RegExp(debouncedSearchQuery, caseSensitive ? 'g' : 'gi');
              hasMatch = regex.test(lineText);
            } catch {
              // Invalid regex, fallback to plain text
              hasMatch = caseSensitive
                ? lineText.includes(debouncedSearchQuery)
                : lineText.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
            }
          } else {
            hasMatch = caseSensitive
              ? lineText.includes(debouncedSearchQuery)
              : lineText.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
          }

          if (hasMatch) {
            const matchIndex = caseSensitive
              ? lineText.indexOf(debouncedSearchQuery)
              : lineText.toLowerCase().indexOf(debouncedSearchQuery.toLowerCase());

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
  }, [debouncedSearchQuery, activeProject, caseSensitive, useRegex, searchMode]);

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

        <div className="search-tabs">
          <button
            className={`tab-btn ${searchMode === 'keyword' ? 'active' : ''}`}
            onClick={() => {
              setSearchMode('keyword');
              setSemanticResults([]);
            }}
          >
            Keyword
          </button>
          <button
            className={`tab-btn ${searchMode === 'semantic' ? 'active' : ''}`}
            onClick={() => {
              setSearchMode('semantic');
              setResults([]);
            }}
          >
            Semantic
          </button>
        </div>

        <div className="search-controls">
          <input
            type="text"
            className="search-input"
            placeholder={searchMode === 'semantic' ? 'Describe what you\'re looking for...' : 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchMode === 'semantic') {
                handleSemanticSearch();
              }
            }}
            autoFocus
          />
          {searchMode === 'keyword' && (
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
          )}
          {searchMode === 'semantic' && (
            <button
              className="semantic-search-btn"
              onClick={handleSemanticSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          )}
        </div>

        <div className="search-results">
          {searchMode === 'keyword' && (
            <>
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
            </>
          )}

          {searchMode === 'semantic' && (
            <>
              {isSearching && <div className="search-status">Searching semantically...</div>}
              {!isSearching && searchQuery && semanticResults.length === 0 && (
                <div className="search-status">No semantic matches found</div>
              )}
              {!isSearching && semanticResults.length > 0 && (
                <>
                  <div className="results-count">
                    {semanticResults.length} semantic match{semanticResults.length !== 1 ? 'es' : ''}
                  </div>
                  <div className="semantic-results">
                    {semanticResults.map((result, index) => (
                      <div
                        key={`${result.chunk.id}-${index}`}
                        className="semantic-result-item"
                        onClick={() => {
                          onFileSelect(result.filePath, result.lineStart);
                          onClose();
                        }}
                      >
                        <div className="semantic-result-header">
                          <span className="semantic-result-file">{result.filePath.split('/').pop()}</span>
                          <span className="semantic-result-similarity">
                            {(result.similarity * 100).toFixed(0)}% match
                          </span>
                        </div>
                        <div className="semantic-result-location">
                          Lines {result.lineStart}-{result.lineEnd}
                        </div>
                        <div className="semantic-result-preview">
                          {result.preview}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectSearch;

