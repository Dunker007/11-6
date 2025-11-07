import { useState } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import '../../styles/AIProjectGenerator.css';

interface AIProjectGeneratorProps {
  onGenerate: (name: string, description: string) => Promise<void>;
}

function AIProjectGenerator({ onGenerate }: AIProjectGeneratorProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { availableProviders } = useLLMStore();

  const canGenerate = availableProviders.length > 0;

  const handleGenerate = async () => {
    if (!projectName.trim() || !description.trim()) {
      setError('Please provide both project name and description');
      return;
    }

    if (!canGenerate) {
      setError('No LLM provider available. Please configure an API key or start a local LLM.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await onGenerate(projectName.trim(), description.trim());
      // Reset form on success
      setProjectName('');
      setDescription('');
    } catch (err) {
      setError((err as Error).message || 'Failed to generate project');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="ai-project-generator">
      <div className="generator-header">
        <h2>🤖 AI Project Generator</h2>
        <p>Describe your project and let AI create it for you</p>
      </div>

      {!canGenerate && (
        <div className="warning-banner">
          <p>
            ⚠️ No LLM provider available. Configure an API key in Settings or start a local LLM (LM Studio/Ollama).
          </p>
        </div>
      )}

      <div className="generator-form">
        <div className="form-group">
          <label htmlFor="project-name">Project Name</label>
          <input
            id="project-name"
            type="text"
            placeholder="my-awesome-project"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={isGenerating}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Project Description</label>
          <textarea
            id="description"
            placeholder="A web application for managing tasks with real-time collaboration..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isGenerating}
            rows={6}
            className="form-textarea"
          />
          <p className="form-hint">
            Be specific about the framework, features, and technologies you want to use.
          </p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate || !projectName.trim() || !description.trim()}
          className="generate-btn"
        >
          {isGenerating ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            '✨ Generate Project'
          )}
        </button>
      </div>

      <div className="generator-examples">
        <h3>Example Descriptions</h3>
        <div className="examples-list">
          <div className="example-item">
            <strong>React Dashboard:</strong> "A React dashboard with TypeScript, Tailwind CSS, and charts for data visualization"
          </div>
          <div className="example-item">
            <strong>REST API:</strong> "A Node.js Express API with TypeScript, MongoDB, and JWT authentication"
          </div>
          <div className="example-item">
            <strong>Full Stack:</strong> "A Next.js application with Prisma, PostgreSQL, and authentication"
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIProjectGenerator;

