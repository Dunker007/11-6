import React, { useState, useCallback } from 'react';
import { googleCloudNLProvider } from '@/services/ai/providers/googleCloudNLProvider';
import { extractComments, ExtractedComment } from '@/utils/codeParser';
import type { SentimentAnalysisResponse, EntityAnalysisResponse } from '@/types/googleCloudNL';
import { useProjectStore } from '@/services/project/projectStore';
import LoadingSpinner from '../shared/LoadingSpinner';
import '../../styles/SmartCommentsPanel.css';

/**
 * @/components/CodeAnalysis/SmartCommentsPanel.tsx
 *
 * PURPOSE:
 * A UI component that displays the results of the "Smart Comments" analysis.
 * It will take the content of a code file, send the comments to the
 * Google Cloud Natural Language API via the provider, and then render the
 * insights, such as sentiment scores and identified entities (e.g., TODOs).
 */

interface AnalysisResult {
  comment: ExtractedComment;
  sentiment?: SentimentAnalysisResponse['documentSentiment'];
  entities?: EntityAnalysisResponse['entities'];
}

const SmartCommentsPanel: React.FC = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activeFile, getFileContent } = useProjectStore();

  const handleAnalyzeClick = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResults([]);

    if (!googleCloudNLProvider.isAvailable) {
      setError('Google Cloud NL API key is not configured.');
      setIsLoading(false);
      return;
    }

    if (!activeFile) {
      setError('No active file selected. Please open a file to analyze.');
      setIsLoading(false);
      return;
    }

    const fileContent = getFileContent(activeFile);
    if (!fileContent) {
      setError('Could not read file content. Please ensure the file exists and is accessible.');
      setIsLoading(false);
      return;
    }

    try {
      const comments = extractComments(fileContent);
      
      if (comments.length === 0) {
        setError('No comments found in the active file.');
        setIsLoading(false);
        return;
      }

      const results: AnalysisResult[] = [];

      for (const comment of comments) {
        // Run both analyses in parallel for efficiency.
        const [sentimentRes, entitiesRes] = await Promise.all([
          googleCloudNLProvider.analyzeSentiment({
            content: comment.text,
            type: 'PLAIN_TEXT',
          }),
          googleCloudNLProvider.analyzeEntities({
            content: comment.text,
            type: 'PLAIN_TEXT',
          }),
        ]);

        results.push({
          comment,
          sentiment: sentimentRes.documentSentiment,
          entities: entitiesRes.entities,
        });
      }

      setAnalysisResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFile, getFileContent]);

  return (
    <div className="smart-comments-panel">
      <h4>Smart Comments Analysis</h4>
      <p>
        Analyze the comments in the active file to gain insights using Google's Natural Language API.
      </p>

      {activeFile && (
        <div className="file-info">
          <p>
            <span className="file-name">{activeFile}</span>
          </p>
        </div>
      )}

      {!activeFile && (
        <div className="empty-state">
          <p>No file selected. Please open a file to analyze its comments.</p>
        </div>
      )}

      <button onClick={handleAnalyzeClick} disabled={isLoading || !activeFile}>
        {isLoading && <LoadingSpinner size={16} />}
        {isLoading ? 'Analyzing...' : 'Analyze Active File'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {analysisResults.length > 0 && (
        <div className="results-list">
          {analysisResults.map((result, index) => (
            <div key={index} className="result-item">
              <p>
                <strong>Line {result.comment.lineNumber}:</strong> "{result.comment.text}"
              </p>
              {result.sentiment && (
                <div className="sentiment-display">
                  <div className="sentiment-score">
                    <span className="sentiment-label">Sentiment:</span>
                    <div className="sentiment-bar-container">
                      <div 
                        className={`sentiment-bar ${result.sentiment.score > 0 ? 'positive' : result.sentiment.score < 0 ? 'negative' : 'neutral'}`}
                        style={{ width: `${Math.abs(result.sentiment.score) * 100}%` }}
                      />
                    </div>
                    <span className="sentiment-value">{result.sentiment.score.toFixed(2)}</span>
                  </div>
                  <div className="sentiment-magnitude">
                    Magnitude: {result.sentiment.magnitude.toFixed(2)}
                  </div>
                </div>
              )}
              {result.entities && result.entities.length > 0 && (
                <div className="entity-tags">
                  <strong>Entities:</strong>
                  {result.entities.map((entity, i) => (
                    <div key={i} className="entity-tag">
                      <span className="entity-name">{entity.name}</span>
                      <span className="entity-type">({entity.type})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartCommentsPanel;
