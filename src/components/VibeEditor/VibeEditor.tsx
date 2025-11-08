import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { errorContext } from '../../services/errors/errorContext';
import FileExplorer from './FileExplorer';
import AIAssistant from '../AIAssistant/AIAssistant';
import ProjectSearch from '../ProjectSearch/ProjectSearch';
import TechIcon from '../Icons/TechIcon';
import { Save, Search, Sliders, Code, ChevronDown, Brain, Sparkles, FolderOpen, Plus, X, Check } from 'lucide-react';
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
  const [showSettings, setShowSettings] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // Update error context when project or file changes
  useEffect(() => {
    errorContext.setProject(activeProject?.id || null);
  }, [activeProject]);

  useEffect(() => {
    errorContext.setFile(activeFilePath);
  }, [activeFilePath]);

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
      
      // Clear any existing timeout before setting a new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      
      // Debounce the save
      saveTimeoutRef.current = setTimeout(() => {
        updateFile(activeFilePath, value);
        setUnsavedChanges(false);
        setSaveStatus('saved');
        
        // Track activity
        const fileName = activeFilePath.split('/').pop() || activeFilePath;
        addActivity('file', 'saved', `Saved ${fileName}`);
        
        // Show "Saved" for 2 seconds
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('saved');
        }, 2000);
      }, 500);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const handleFileSelect = (path: string, line?: number) => {
    setActiveFilePath(path);
    // Scroll to line if provided
    if (line && editorRef.current) {
      setTimeout(() => {
        editorRef.current?.revealLineInCenter(line);
        editorRef.current?.setPosition({ lineNumber: line, column: 1 });
      }, 100);
    }
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
              <TechIcon icon={Plus} size={20} glow="cyan" />
              <span>New Project</span>
            </button>
            <button className="action-button" onClick={handleOpenProject}>
              <TechIcon icon={FolderOpen} size={20} glow="violet" />
              <span>Open Project</span>
            </button>
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
                <TechIcon icon={FolderOpen} size={16} glow="none" />
                <span className="project-name">{activeProject.name}</span>
                <TechIcon icon={ChevronDown} size={14} glow="none" className="dropdown-icon" />
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
                        <TechIcon icon={Plus} size={16} glow="cyan" />
                      </button>
                    </div>
                    <div className="project-list">
                      {projects.map((project) => (
                        <div
                          key={project.id}
                          className={`project-item ${activeProject.id === project.id ? 'active' : ''}`}
                          onClick={() => handleProjectSwitch(project.id)}
                        >
                          <TechIcon icon={FolderOpen} size={14} glow="none" className="project-icon" />
                          <span className="project-item-name">{project.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="sidebar-actions">
              <button
                className="icon-btn"
                onClick={() => setShowProjectSearch(true)}
                title="Search Project (Ctrl+Shift+F)"
              >
                <TechIcon icon={Search} size={18} glow="none" />
              </button>
              <button
                className="icon-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Editor Settings"
              >
                <TechIcon icon={Sliders} size={18} glow="none" />
              </button>
              <button
                className={`icon-btn ai-toggle ${showAIAssistant ? 'active' : ''}`}
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                title={showAIAssistant ? 'Hide AI Assistant (Ctrl+\\)' : 'Show AI Assistant (Ctrl+\\)'}
              >
                <TechIcon icon={showAIAssistant ? Brain : Sparkles} size={18} glow={showAIAssistant ? 'violet' : 'none'} animated={showAIAssistant} />
              </button>
            </div>
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
                  <TechIcon icon={Code} size={14} glow="none" className="tab-icon" />
                  <span className="tab-name">{activeFilePath.split('/').pop()}</span>
                  {unsavedChanges && <span className="unsaved-indicator" />}
                  <button className="tab-close" title="Close file">
                    <TechIcon icon={X} size={12} glow="none" />
                  </button>
                </div>
              )}
            </div>
            <div className="editor-toolbar">
              <div className="save-status">
                {saveStatus === 'saving' && (
                  <div className="status-indicator saving">
                    <TechIcon icon={Save} size={14} glow="amber" animated={true} />
                    <span>Saving...</span>
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="status-indicator saved">
                    <TechIcon icon={Check} size={14} glow="cyan" />
                    <span>Saved</span>
                  </div>
                )}
                {saveStatus === 'unsaved' && unsavedChanges && (
                  <div className="status-indicator unsaved">
                    <span className="unsaved-dot" />
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>
              <div className="editor-info">
                <span className="language-badge">{language}</span>
                <span className="separator">|</span>
                <span className="line-info">Ln {1}, Col {1}</span>
              </div>
            </div>
          </div>

          <div className="editor-content">
            {activeFilePath ? (
              <Editor
                height="100%"
                language={language}
                value={fileContent}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
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
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  fontLigatures: true,
                  bracketPairColorization: {
                    enabled: true,
                  },
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
