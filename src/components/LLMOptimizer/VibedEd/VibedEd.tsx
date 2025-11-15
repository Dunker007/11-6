import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useProjectStore } from '@/services/project/projectStore';
import { useActivityStore } from '@/services/activity/activityStore';
import { errorContext } from '@/services/errors/errorContext';
import FileExplorer from '@/components/VibeEditor/FileExplorer';
import TurboEdit from '@/components/VibeEditor/TurboEdit';
import AIAssistant from '@/components/AIAssistant/AIAssistant';
import ProjectSearch from '@/components/ProjectSearch/ProjectSearch';
import { Search, Code, Brain, FolderOpen, Plus, X } from 'lucide-react';
import '@/styles/VibedEd.css';

function VibedEd() {
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
  const [showTurboEdit, setShowTurboEdit] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

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

      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        if (activeFilePath && unsavedChanges) {
          updateFile(activeFilePath, fileContent);
          setUnsavedChanges(false);
          setSaveStatus('saved');
          const fileName = activeFilePath.split('/').pop() || activeFilePath;
          addActivity('file', 'saved', `Saved ${fileName}`);
        }
      }

      if (ctrlKey && e.key === 'b') {
        e.preventDefault();
        const sidebar = document.querySelector('.vibed-ed-sidebar') as HTMLElement;
        if (sidebar) {
          sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
        }
      }

      if (ctrlKey && e.key === '\\') {
        e.preventDefault();
        setShowAIAssistant(!showAIAssistant);
      }

      if (ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowProjectSearch(true);
      }

      if (ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (editorRef.current) {
          const selection = editorRef.current.getSelection();
          if (selection) {
            const selectedText = editorRef.current.getModel()?.getValueInRange(selection) || '';
            if (selectedText.trim()) {
              setSelectedCode(selectedText);
              setShowTurboEdit(true);
            } else {
              const fullText = editorRef.current.getValue();
              setSelectedCode(fullText);
              setShowTurboEdit(true);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [activeFilePath, unsavedChanges, fileContent, updateFile, showAIAssistant, addActivity]);

  useEffect(() => {
    if (activeFilePath && activeProject) {
      const content = getFileContent(activeFilePath);
      setFileContent(content || '');
      setActiveFile(activeFilePath);
      setUnsavedChanges(false);
      setSaveStatus('saved');
      
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

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      setFileContent(value);
      setUnsavedChanges(true);
      setSaveStatus('saving');
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        updateFile(activeFilePath, value);
        setUnsavedChanges(false);
        setSaveStatus('saved');
        
        const fileName = activeFilePath.split('/').pop() || activeFilePath;
        addActivity('file', 'saved', `Saved ${fileName}`);
        
        statusTimeoutRef.current = setTimeout(() => {
          setSaveStatus('saved');
        }, 2000);
      }, 500);
    }
  }, [activeFilePath, updateFile, addActivity]);

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

  const handleFileSelect = useCallback((path: string) => {
    setActiveFilePath(path);
  }, []);

  const handleNewProject = useCallback(() => {
    const name = prompt('Project name:');
    if (name) {
      createProject(name);
      setShowProjectMenu(false);
    }
  }, [createProject]);

  const files = useMemo(() => {
    return activeProject?.files || [];
  }, [activeProject]);

  if (!activeProject) {
    return (
      <div className="vibed-ed-container">
        <div className="vibed-ed-welcome">
          <div className="welcome-content">
            <Code size={64} />
            <h2>Vibed Ed</h2>
            <p>AI-Powered Code Editor</p>
            <button onClick={handleNewProject} className="welcome-btn">
              <Plus size={16} />
              <span>New Project</span>
            </button>
            {projects.length > 0 && (
              <div className="recent-projects">
                <h3>Recent Projects</h3>
                <div className="project-list">
                  {projects.slice(0, 5).map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setActiveProject(project.id)}
                      className="project-item"
                    >
                      <FolderOpen size={16} />
                      <span>{project.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vibed-ed-container">
      {/* Toolbar */}
      <div className="vibed-ed-toolbar">
        <div className="toolbar-left">
          <div className="project-selector">
            <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="project-btn">
              <FolderOpen size={16} />
              <span>{activeProject.name}</span>
            </button>
            {showProjectMenu && (
              <div className="project-menu">
                <button onClick={handleNewProject} className="menu-item">
                  <Plus size={16} />
                  <span>New Project</span>
                </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setActiveProject(project.id);
                      setShowProjectMenu(false);
                    }}
                    className={`menu-item ${project.id === activeProject.id ? 'active' : ''}`}
                  >
                    <FolderOpen size={16} />
                    <span>{project.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="toolbar-center">
          {activeFilePath && (
            <div className="file-info">
              <span className="file-name">{activeFilePath.split('/').pop()}</span>
              <span className={`save-status ${saveStatus}`}>
                {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
              </span>
            </div>
          )}
        </div>
        <div className="toolbar-right">
          <button
            onClick={() => setShowProjectSearch(true)}
            className="toolbar-btn"
            title="Search (Ctrl+Shift+F)"
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`toolbar-btn ${showAIAssistant ? 'active' : ''}`}
            title="Toggle AI Assistant (Ctrl+\\)"
          >
            <Brain size={16} />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="vibed-ed-layout">
        {/* Sidebar - File Explorer */}
        <div className="vibed-ed-sidebar">
          <FileExplorer
            files={files}
            activeFile={activeFilePath}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Editor Area */}
        <div className="vibed-ed-editor-area">
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
                wordWrap: 'on',
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                insertSpaces: true,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          ) : (
            <div className="editor-placeholder">
              <Code size={48} />
              <p>Select a file to start editing</p>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        {showAIAssistant && (
          <div className="vibed-ed-ai-panel">
            <div className="ai-panel-header">
              <Brain size={16} />
              <span>AI Assistant</span>
              <button onClick={() => setShowAIAssistant(false)} className="close-btn">
                <X size={16} />
              </button>
            </div>
            <AIAssistant />
          </div>
        )}
      </div>

      {/* Modals */}
      {showProjectSearch && (
        <ProjectSearch
          onClose={() => setShowProjectSearch(false)}
          onFileSelect={(path, line) => {
            setActiveFilePath(path);
            if (line && editorRef.current) {
              setTimeout(() => {
                editorRef.current?.revealLineInCenter(line);
                editorRef.current?.setPosition({ lineNumber: line, column: 1 });
              }, 100);
            }
          }}
        />
      )}

      {showTurboEdit && (
        <TurboEdit
          selectedCode={selectedCode}
          filePath={activeFilePath || undefined}
          onApply={(newCode) => {
            if (editorRef.current && activeFilePath) {
              const model = editorRef.current.getModel();
              if (model) {
                const selection = editorRef.current.getSelection();
                if (selection) {
                  model.pushEditOperations(
                    [],
                    [
                      {
                        range: selection,
                        text: newCode,
                      },
                    ],
                    () => null
                  );
                }
              }
            }
            setShowTurboEdit(false);
          }}
          onCancel={() => setShowTurboEdit(false)}
        />
      )}
    </div>
  );
}

export default VibedEd;

