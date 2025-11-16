import React, { useState, useCallback, useMemo } from 'react';
import { notebookLMService } from '@/services/ai/notebooklmService';
import { useProjectStore } from '@/services/project/projectStore';
import { Button } from '../ui';
import { Send, Copy, Check, MessageSquare } from '@/components/Icons/icons';
import LoadingSpinner from '../shared/LoadingSpinner';
import '../../styles/ProjectQA.css';

interface QAPair {
  question: string;
  answer: any;
  timestamp: Date;
}

const ProjectQA: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<QAPair[]>([]);
  const { activeProject } = useProjectStore();

  const handleAskQuestion = useCallback(async () => {
    if (!question.trim() || !activeProject) {
      setError('Please enter a question and ensure a project is active.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const result = await notebookLMService.answerProjectQuestion(
        activeProject.id,
        activeProject.name,
        activeProject.rootPath,
        question
      );
      setAnswer(result);
      
      // Add to history
      setHistory((prev) => [
        { question, answer: result, timestamp: new Date() },
        ...prev.slice(0, 9), // Keep last 10 items
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [question, activeProject]);

  const handleCopyAnswer = useCallback(async () => {
    if (!answer?.text) return;
    
    try {
      await navigator.clipboard.writeText(answer.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }, [answer]);

  const handleSelectHistoryItem = useCallback((qaPair: QAPair) => {
    setQuestion(qaPair.question);
    setAnswer(qaPair.answer);
    setError(null);
  }, []);

  const formatAnswer = useMemo(() => {
    if (!answer?.text) return '';
    
    // Simple markdown-like formatting
    let formatted = answer.text;
    
    // Convert code blocks
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match: string, _lang: string, code: string) => {
      return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
    });
    
    // Convert inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br />');
    
    return formatted;
  }, [answer]);

  const hasNoData = !answer && !isLoading && history.length === 0;

  return (
    <div className="project-qa-panel">
      <h4>Project Q&A</h4>
      <p>Ask a question about the current project, and get an answer based on its source code.</p>
      
      <div className="qa-input-container">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAskQuestion();
            }
          }}
          placeholder="e.g., 'How is authentication handled in this project?'"
          disabled={isLoading || !activeProject}
          rows={3}
        />
        <Button onClick={handleAskQuestion} disabled={isLoading || !activeProject}>
          {isLoading ? <LoadingSpinner size={16} /> : <Send />}
          Ask
        </Button>
      </div>

      {!activeProject && (
        <div className="qa-empty-state">
          <MessageSquare className="empty-icon" />
          <p>No active project</p>
          <p>Open a project to start asking questions about its code.</p>
        </div>
      )}

      {hasNoData && activeProject && (
        <div className="qa-empty-state">
          <MessageSquare className="empty-icon" />
          <p>Ask your first question</p>
          <p>Try asking about:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '0.5rem' }}>
            <li>How authentication works</li>
            <li>Where API routes are defined</li>
            <li>What dependencies are used</li>
          </ul>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {answer && (
        <div className="qa-answer-container">
          <h5>
            Answer:
            <button
              className={`copy-answer-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopyAnswer}
              type="button"
              aria-label="Copy answer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </h5>
          <div
            className="qa-answer-text"
            dangerouslySetInnerHTML={{ __html: formatAnswer }}
          />
          {answer.sources && answer.sources.length > 0 && (
            <div className="qa-sources">
              <h6>Sources:</h6>
              <ul>
                {answer.sources.slice(0, 5).map((source: string, index: number) => (
                  <li key={index}>
                    {source.startsWith('http') ? (
                      <a href={source} target="_blank" rel="noopener noreferrer">
                        {source}
                      </a>
                    ) : (
                      <code>{source}</code>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="qa-history">
          <h6>Recent Questions</h6>
          {history.map((qaPair, idx) => (
            <div
              key={idx}
              className="qa-history-item"
              onClick={() => handleSelectHistoryItem(qaPair)}
            >
              <div className="history-question">{qaPair.question}</div>
              <div className="history-timestamp">
                {qaPair.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectQA;
