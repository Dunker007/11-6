import { useState } from 'react';
import { createService } from '../../services/create/createService';
import { useProjectStore } from '../../services/project/projectStore';
import ProjectTemplates from './ProjectTemplates';
import AIProjectGenerator from './AIProjectGenerator';
import '../../styles/CreateWorkflow.css';

interface CreateWorkflowProps {
  onProjectCreated?: () => void;
}

function CreateWorkflow({ onProjectCreated }: CreateWorkflowProps) {
  const [mode, setMode] = useState<'select' | 'templates' | 'ai'>('select');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setActiveProject } = useProjectStore();

  const handleTemplateSelect = async (templateId: string) => {
    const projectName = prompt('Enter project name:');
    if (!projectName?.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const project = await createService.createFromTemplate(
        templateId,
        projectName.trim(),
        undefined
      );
      
      // Set as active project
      setActiveProject(project.id);
      
      // Switch to Build workflow
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to create project from template');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAIGenerate = async (name: string, description: string) => {
    setIsCreating(true);
    setError(null);

    try {
      const project = await createService.createFromAI(name, description);
      
      // Set as active project
      setActiveProject(project.id);
      
      // Switch to Build workflow
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to generate project');
      throw err; // Re-throw so AIProjectGenerator can handle it
    } finally {
      setIsCreating(false);
    }
  };

  if (mode === 'templates') {
    return (
      <div className="create-workflow">
        <div className="workflow-header">
          <button className="back-btn" onClick={() => setMode('select')}>
            ← Back
          </button>
          <h2>Project Templates</h2>
        </div>
        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}
        <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
      </div>
    );
  }

  if (mode === 'ai') {
    return (
      <div className="create-workflow">
        <div className="workflow-header">
          <button className="back-btn" onClick={() => setMode('select')}>
            ← Back
          </button>
          <h2>AI Project Generator</h2>
        </div>
        <AIProjectGenerator onGenerate={handleAIGenerate} />
      </div>
    );
  }

  return (
    <div className="create-workflow">
      <div className="workflow-placeholder-content">
        <h2>Create Workflow</h2>
        <p>Start a new project from templates or use AI to generate one</p>
        
        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <div className="create-options">
          <div className="create-option">
            <div className="option-icon">📋</div>
            <h3>Templates</h3>
            <p>Choose from pre-built project templates</p>
            <button 
              className="option-button"
              onClick={() => setMode('templates')}
              disabled={isCreating}
            >
              Browse Templates
            </button>
          </div>
          <div className="create-option">
            <div className="option-icon">🤖</div>
            <h3>AI Generator</h3>
            <p>Describe your project and let AI create it</p>
            <button 
              className="option-button"
              onClick={() => setMode('ai')}
              disabled={isCreating}
            >
              Generate with AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateWorkflow;
