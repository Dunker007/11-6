import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../services/project/projectStore';
import FileExplorer from './FileExplorer';
import AIAssistant from '../AIAssistant/AIAssistant';
import '../../styles/VibeEditor.css';

function VibeEditor() {
  const { activeProject, loadProjects, createProject, updateFile, getFileContent, setActiveFile } = useProjectStore();
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [showAIAssistant, setShowAIAssistant] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeFilePath && activeProject) {
      const content = getFileContent(activeFilePath);
      setFileContent(content || '');
      setActiveFile(activeFilePath);
      
      // Detect language from file extension
      const ext = activeFilePath.split('.').pop()?.toLowerCase();
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
        sql: 'sql',
      };
      setLanguage(langMap[ext || ''] || 'plaintext');
    }
  }, [activeFilePath, activeProject, getFileContent, setActiveFile]);

  const handleEditorChange = (value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      setFileContent(value);
      updateFile(activeFilePath, value);
    }
  };

  const handleFileSelect = (path: string) => {
    setActiveFilePath(path);
  };

  const handleNewProject = () => {
    const name = prompt('Project name:');
    if (name) {
      createProject(name);
    }
  };

  if (!activeProject) {
    return (
      <div className="vibe-editor">
        <div className="welcome-screen">
          <div className="welcome-logo">
            <img src="/vibdee-logo.svg" alt="VibeEditor" />
          </div>
          <h1>Welcome to VibeEditor</h1>
          <p>Your AI-native development companion</p>
          <div className="welcome-actions">
            <button className="action-button primary" onClick={handleNewProject}>
              New Project
            </button>
            <button className="action-button">Open Project</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vibdee-editor">
      <div className="editor-layout">
        <div className="editor-sidebar">
          <div className="sidebar-header">
            <span className="project-name">{activeProject.name}</span>
            <button
              className="ai-toggle"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              title={showAIAssistant ? 'Hide AI Assistant' : 'Show AI Assistant'}
            >
              {showAIAssistant ? '🧠' : '🤖'}
            </button>
          </div>
          <FileExplorer
            files={activeProject.files}
            activeFile={activeFilePath}
            onFileSelect={handleFileSelect}
          />
        </div>

        <div className="editor-main">
          <div className="editor-header">
            <div className="editor-tabs">
              {activeFilePath && (
                <div className="editor-tab active">
                  <span>{activeFilePath.split('/').pop()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="editor-content">
            {activeFilePath ? (
              <Editor
                height="100%"
                language={language}
                value={fileContent}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            ) : (
              <div className="editor-placeholder">
                <p>Select a file from the explorer to start editing</p>
              </div>
            )}
          </div>
        </div>

        {showAIAssistant && (
          <div className="ai-assistant-panel">
            <AIAssistant />
          </div>
        )}
      </div>
    </div>
  );
}

export default VibeEditor;
