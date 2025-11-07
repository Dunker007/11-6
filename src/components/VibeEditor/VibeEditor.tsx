import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import FileExplorer from './FileExplorer';
import AIAssistant from '../AIAssistant/AIAssistant';
import ProjectSearch from '../ProjectSearch/ProjectSearch';
import '../../styles/VibeEditor.css';

function VibeEditor() {
  const { activeProject, projects, loadProjects, createProject, setActiveProject, updateFile, getFileContent, setActiveFile } = useProjectStore();
  const { addActivity } = useActivityStore();
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showProjectSearch, setShowProjectSearch] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl+S: Manual save
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeFilePath && unsavedChanges) {
          updateFile(activeFilePath, fileContent);
          setUnsavedChanges(false);
          setSaveStatus('saved');
          
          // Track activity
          const fileName = activeFilePath.split('/').pop() || activeFilePath;
          addActivity('file', 'saved', `Saved ${fileName}`);
        }
      }

      // Ctrl+B: Toggle sidebar
      if (ctrlKey && e.key === 'b') {
        e.preventDefault();
        const sidebar = document.querySelector('.editor-sidebar') as HTMLElement;
        if (sidebar) {
          sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
        }
      }

      // Ctrl+\: Toggle AI Assistant
      if (ctrlKey && e.key === '\\') {
        e.preventDefault();
        setShowAIAssistant(!showAIAssistant);
      }

      // Ctrl+Shift+F: Project-wide search
      if (ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowProjectSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [activeFilePath, unsavedChanges, fileContent, updateFile, showAIAssistant]);

  useEffect(() => {
    if (activeFilePath && activeProject) {
      const content = getFileContent(activeFilePath);
      setFileContent(content || '');
      setActiveFile(activeFilePath);
      setUnsavedChanges(false);
      setSaveStatus('saved');
      
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
      setUnsavedChanges(true);
      setSaveStatus('saving');
      
      // Debounce the save
      const timeoutId = setTimeout(() => {
        updateFile(activeFilePath, value);
        setUnsavedChanges(false);
        setSaveStatus('saved');
        
        // Track activity
        const fileName = activeFilePath.split('/').pop() || activeFilePath;
        addActivity('file', 'saved', `Saved ${fileName}`);
        
        // Show "Saved" for 2 seconds
        setTimeout(() => {
          setSaveStatus('saved');
        }, 2000);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleFileSelect = (path: string, line?: number) => {
    setActiveFilePath(path);
    // TODO: Scroll to line if provided
    // Monaco editor has a method: editor.revealLineInCenter(line)
  };

  const handleNewProject = () => {
    const name = prompt('Project name:');
    if (name) {
      createProject(name);
      setShowProjectMenu(false);
    }
  };

  const handleProjectSwitch = (projectId: string) => {
    setActiveProject(projectId);
    setActiveFilePath(null);
    setShowProjectMenu(false);
  };

  const handleOpenProject = async () => {
    if (window.dialogs) {
      try {
        const result = await window.dialogs.openDirectory();
        if (result && result.success && result.filePaths && result.filePaths.length > 0) {
          const path = result.filePaths[0];
          // Use projectService to open from disk
          const { projectService } = await import('../../services/project/projectService');
          const project = await projectService.openProjectFromDisk(path);
          if (project) {
            // Reload projects to update the list
            loadProjects();
          } else {
            alert('Failed to open project from ' + path);
          }
        }
      } catch (error) {
        console.error('Failed to open project:', error);
        alert('Failed to open project: ' + (error as Error).message);
      }
    } else {
      alert('File dialogs are only available in the Electron app');
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
            <button className="action-button" onClick={handleOpenProject}>Open Project</button>
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
            <div className="project-selector">
              <button 
                className="project-dropdown-btn"
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                title="Switch project"
              >
                <span className="project-name">{activeProject.name}</span>
                <span className="dropdown-icon">▼</span>
              </button>
              {showProjectMenu && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowProjectMenu(false)} />
                  <div className="project-menu">
                    <div className="project-menu-header">
                      <span>Projects</span>
                      <button 
                        className="new-project-btn"
                        onClick={handleNewProject}
                        title="New Project"
                      >
                        +
                      </button>
                    </div>
                    <div className="project-list">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className={`project-item ${activeProject.id === project.id ? 'active' : ''}`}
                          onClick={() => handleProjectSwitch(project.id)}
                        >
                          <span className="project-icon">📁</span>
                          <span className="project-item-name">{project.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
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
                  {unsavedChanges && <span className="unsaved-dot">●</span>}
                  <span>{activeFilePath.split('/').pop()}</span>
                </div>
              )}
            </div>
            <div className="save-status">
              {saveStatus === 'saving' && <span className="status-indicator saving">Saving...</span>}
              {saveStatus === 'saved' && <span className="status-indicator saved">✓ Saved</span>}
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
                  find: {
                    addExtraSpaceOnTop: false,
                    autoFindInSelection: 'never',
                    seedSearchStringFromSelection: 'always',
                  },
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

      {showProjectSearch && (
        <ProjectSearch
          onClose={() => setShowProjectSearch(false)}
          onFileSelect={handleFileSelect}
        />
      )}
    </div>
  );
}

export default VibeEditor;
