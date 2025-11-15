import React, { useState, useEffect } from 'react';
import { notebookLMService } from '@/services/ai/notebooklmService';
import type { Notebook, Source } from '@/types/notebooklm';
import { Book, FileText, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import '@/styles/NotebookLMBrowser.css';

const NotebookLMBrowser: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchNotebooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is a placeholder for the actual API call
      const fetchedNotebooks = await notebookLMService.listNotebooks();
      setNotebooks(fetchedNotebooks);
    } catch (err) {
      setError('Failed to fetch notebooks. Ensure your NotebookLM API key is correct.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNotebook = async (notebook: Notebook) => {
    setSelectedNotebook(notebook);
    setIsLoading(true);
    setError(null);
    try {
        // This is a placeholder for the actual API call
      const fetchedSources = await notebookLMService.listSources(notebook.id);
      setSources(fetchedSources);
    } catch (err) {
      setError(`Failed to fetch sources for ${notebook.name}.`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchNotebooks();
  }, []);

  return (
    <div className="notebook-lm-browser">
      <h4>NotebookLM Context</h4>
      <p>Select sources from your NotebookLM notebooks to use as context.</p>
      
      <div className="notebook-controls">
        <button onClick={handleFetchNotebooks} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Refreshing...' : 'Refresh Notebooks'}
        </button>
      </div>

      {error && (
        <div className="notebook-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="notebook-columns">
        <div className="notebook-list-column">
          <h5>Notebooks</h5>
          <ul>
            {notebooks.map(notebook => (
              <li key={notebook.id} onClick={() => handleSelectNotebook(notebook)}>
                <Book size={16} />
                <span>{notebook.name}</span>
                <ChevronRight size={16} />
              </li>
            ))}
          </ul>
        </div>

        <div className="source-list-column">
          <h5>Sources in {selectedNotebook?.name || '...'}</h5>
          <ul>
            {sources.map(source => (
              <li key={source.id}>
                <FileText size={16} />
                <span>{source.displayName}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotebookLMBrowser;
