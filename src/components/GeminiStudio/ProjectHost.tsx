import React, { useState, useCallback } from 'react';
import { geminiStudioService, ImportResult } from '@/services/ai/geminiStudioService';
import { geminiFunctionRegistry } from '@/services/ai/geminiFunctions';
import { llmRouter } from '@/services/ai/router';
import type { GeminiStudioProject } from '@/types/geminiStudio';
import type { GeminiFunctionDeclaration } from '@/types/gemini';
import LoadingSpinner from '../shared/LoadingSpinner';
import '../../styles/GeminiStudio.css';

/**
 * @/components/GeminiStudio/ProjectHost.tsx
 *
 * PURPOSE:
 * A component designed to load, display, and interact with an imported
 * Gemini AI Studio project. It will provide a UI for running the project's
 * prompt, viewing its configuration, and managing its execution.
 */
const ProjectHost: React.FC = () => {
  const [project, setProject] = useState<GeminiStudioProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [userInput, setUserInput] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [functions, setFunctions] = useState<GeminiFunctionDeclaration[]>([]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setProject(null);
    setOutput('');
    setUserInput('');

    const result: ImportResult = await geminiStudioService.importProjectFromZip(file);

    if (result.success && result.project) {
      setProject(result.project);
      // Load available functions
      setFunctions(geminiFunctionRegistry.getFunctionDeclarations());
    } else {
      setError(result.error || 'An unknown error occurred during import.');
    }

    setIsLoading(false);
  }, []);

  const handleRunProject = useCallback(async () => {
    if (!project) return;

    setIsRunning(true);
    setError(null);
    setOutput('');

    try {
      const prompt = userInput.trim() || project.prompt.text;
      const modelConfig = project.prompt.modelConfig;

      // Build options with project configuration
      const options = {
        model: modelConfig.model,
        temperature: modelConfig.temperature ?? 0.7,
        maxTokens: modelConfig.maxOutputTokens,
        topP: modelConfig.topP,
        topK: modelConfig.topK,
        stopSequences: modelConfig.stopSequences,
        tools: functions.length > 0 ? [{ functionDeclarations: functions }] : undefined,
      };

      // Use streaming for better UX
      let fullOutput = '';
      for await (const chunk of llmRouter.streamGenerate(prompt, options)) {
        if (chunk.text) {
          fullOutput += chunk.text;
          setOutput(fullOutput);
        }
      }

      if (!fullOutput) {
        setOutput('No response generated.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run project.');
    } finally {
      setIsRunning(false);
    }
  }, [project, userInput, functions]);

  return (
    <div className="project-host-container">
      <div className="project-host-header">
        <h3>Gemini AI Studio Project Host</h3>
        <p>
          Import a <code>.zip</code> file exported from Gemini AI Studio to run it locally.
        </p>
      </div>
      
      <div className="gemini-studio-section">
        <div className="gemini-studio-section-content">
          <div className="import-controls">
            <input 
              type="file" 
              accept=".zip" 
              onChange={handleFileChange} 
              disabled={isLoading}
              className="gemini-studio-input"
            />
            {isLoading && (
              <div className="loading-container">
                <LoadingSpinner size={24} />
                <p className="loading-text">Importing project...</p>
              </div>
            )}
          </div>

          {error && <div className="gemini-studio-error">{error}</div>}

          {project && (
            <div className="project-display">
              <h4>{project.name}</h4>
              {project.description && <p>{project.description}</p>}

              {/* Project Configuration */}
              <div className="project-config-section">
                <h5>Configuration</h5>
                <div className="config-grid">
                  <div className="config-item">
                    <label>Model:</label>
                    <span>{project.prompt.modelConfig.model}</span>
                  </div>
                  {project.prompt.modelConfig.temperature !== undefined && (
                    <div className="config-item">
                      <label>Temperature:</label>
                      <span>{project.prompt.modelConfig.temperature}</span>
                    </div>
                  )}
                  {project.prompt.modelConfig.maxOutputTokens && (
                    <div className="config-item">
                      <label>Max Tokens:</label>
                      <span>{project.prompt.modelConfig.maxOutputTokens}</span>
                    </div>
                  )}
                  {project.prompt.modelConfig.topP !== undefined && (
                    <div className="config-item">
                      <label>Top P:</label>
                      <span>{project.prompt.modelConfig.topP}</span>
                    </div>
                  )}
                  {project.prompt.modelConfig.topK !== undefined && (
                    <div className="config-item">
                      <label>Top K:</label>
                      <span>{project.prompt.modelConfig.topK}</span>
                    </div>
                  )}
                  {project.prompt.type && (
                    <div className="config-item">
                      <label>Prompt Type:</label>
                      <span>{project.prompt.type}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Display */}
              <div className="project-prompt-section">
                <h5>Prompt</h5>
                <div className="prompt-text">{project.prompt.text}</div>
              </div>

              {/* Function Definitions */}
              {functions.length > 0 && (
                <div className="project-functions-section">
                  <h5>Available Functions ({functions.length})</h5>
                  <div className="functions-list">
                    {functions.map((func) => (
                      <div key={func.name} className="function-item">
                        <div className="function-name">{func.name}</div>
                        <div className="function-description">{func.description || 'No description'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examples */}
              {project.examples && project.examples.length > 0 && (
                <div className="project-examples-section">
                  <h5>Examples ({project.examples.length})</h5>
                  {project.examples.map((example, idx) => (
                    <div key={idx} className="example-item">
                      <div className="example-input">
                        <strong>Input:</strong> {example.input}
                      </div>
                      <div className="example-output">
                        <strong>Output:</strong> {example.output}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Run Project */}
              <div className="project-run-section">
                <h5>Run Project</h5>
                <textarea
                  className="gemini-studio-textarea"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={project.prompt.text || 'Enter your input here...'}
                  disabled={isRunning}
                  rows={4}
                />
                <button
                  className="gemini-studio-btn-primary"
                  onClick={handleRunProject}
                  disabled={isRunning}
                >
                  {isRunning && <LoadingSpinner size={16} />}
                  {isRunning ? 'Running...' : 'Run Project'}
                </button>
              </div>

              {/* Output */}
              {output && (
                <div className="project-output-section">
                  <h5>Output</h5>
                  <pre className="output-text">{output}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHost;
