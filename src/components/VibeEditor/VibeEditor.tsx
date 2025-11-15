/**
 * VibeEditor.tsx
 * 
 * PURPOSE:
 * Main code editor component with Monaco Editor integration. Provides full IDE experience
 * with file management, syntax highlighting, AI assistance, project search, and Turbo Edit.
 * Central component for the Build workflow (code editing and development).
 * 
 * ARCHITECTURE:
 * Complex component orchestrating multiple features:
 * - Monaco Editor: Code editing with syntax highlighting
 * - FileExplorer: File tree navigation
 * - AIAssistant: AI-powered code assistance
 * - TurboEdit: AI-powered code editing
 * - ProjectSearch: Project-wide search
 * - Proactive agents: Context-aware suggestions
 * - Semantic indexing: Code understanding
 * 
 * Features:
 * - Auto-save with debouncing
 * - Unsaved changes tracking
 * - Error context integration
 * - Proactive AI suggestions
 * - Custom VibeDS theme
 * - Project creation and management
 * 
 * CURRENT STATUS:
 * ✅ Full Monaco Editor integration
 * ✅ File management (create, edit, delete)
 * ✅ Auto-save functionality
 * ✅ AI Assistant integration
 * ✅ Turbo Edit integration
 * ✅ Project search
 * ✅ Proactive agent suggestions
 * ✅ Semantic indexing
 * ✅ Error context tracking
 * 
 * DEPENDENCIES:
 * - useProjectStore: Project and file management
 * - useActivityStore: Activity logging
 * - errorContext: Error tracking
 * - proactiveAgentService: Proactive suggestions
 * - semanticIndexService: Code indexing
 * - Monaco Editor: Code editing
 * - Sub-components: FileExplorer, AIAssistant, TurboEdit, ProjectSearch
 * 
 * STATE MANAGEMENT:
 * - Local state: file content, language, UI visibility, unsaved changes
 * - Uses multiple Zustand stores
 * - Editor ref for Monaco instance
 * - Timeout refs for debouncing
 * 
 * PERFORMANCE:
 * - Debounced auto-save
 * - Lazy component loading
 * - Efficient re-renders
 * - Semantic indexing runs async
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import VibeEditor from '@/components/VibeEditor/VibeEditor';
 * 
 * function BuildWorkflow() {
 *   return <VibeEditor />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/components/VibeEditor/FileExplorer.tsx: File tree
 * - src/components/VibeEditor/TurboEdit.tsx: AI editing
 * - src/components/AIAssistant/AIAssistant.tsx: AI chat
 * - src/services/project/projectStore.ts: Project state
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Multi-file editing
 * - Split view
 * - Code folding
 * - Minimap customization
 * - Custom keybindings
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { errorContext } from '../../services/errors/errorContext';
import { useToast } from '@/components/ui';
import { proactiveAgentService } from '@/services/agents/proactiveAgentService';
import { useVibesStore } from '@/services/agents/vibesStore';
import { semanticIndexService } from '@/services/ai/semanticIndexService';
import { VibeDSTheme } from '@/services/theme/VibeDSEditorTheme';
import FileExplorer from './FileExplorer';
import TurboEdit from './TurboEdit';
import AIAssistant from '../AIAssistant/AIAssistant';
import ProjectSearch from '../ProjectSearch/ProjectSearch';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { Save, Search, Sliders, Code, ChevronDown, Brain, Sparkles, FolderOpen, Plus, X, Check, Zap } from 'lucide-react';
import WorkflowHero from '../shared/WorkflowHero';
import CommandCard from '../shared/CommandCard';
import '../../styles/VibeEditor.css';

/**
 * Core editor workspace combining Monaco, project management, and AI copilots.
 *
 * @returns Full Vibe Editor experience for active projects.
 */
function VibeEditor() {
  const { activeProject, projects, loadProjects, createProject, setActiveProject, updateFile, getFileContent, setActiveFile } = useProjectStore();
  const { addActivity } = useActivityStore();
  const { showToast } = useToast();
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [language, setLanguage] = useState<string>('typescript');
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showProjectSearch, setShowProjectSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTurboEdit, setShowTurboEdit] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const vibes = useVibesStore((state) => state.vibes);

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
    /**
     * Global keyboard shortcuts for saving, toggling panels, and invoking tools.
     *
     * @param e - Keyboard event captured from window.
     */
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

      // Ctrl+Shift+E: Turbo Edit
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
              // If no selection, use entire file
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
  }, [activeFilePath, unsavedChanges, fileContent, updateFile, showAIAssistant]);

  useEffect(() => {
    if (activeFilePath && activeProject) {
      const content = getFileContent(activeFilePath);
      setFileContent(content || '');
      setActiveFile(activeFilePath);
      setUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Start semantic indexing for the project
      semanticIndexService.startIndexingForCurrentProject().catch(err => {
        console.warn('Semantic indexing failed:', err);
      });
      
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

  /**
   * Sync editor state into the store and debounce persistence to disk.
   *
   * @param value - Latest content emitted by Monaco.
   */
  const handleEditorChange = (value: string | undefined) => {
    if (activeFilePath && value !== undefined) {
      setFileContent(value);
      setUnsavedChanges(true);
      setSaveStatus('saving');
      
      // Trigger proactive code analysis
      proactiveAgentService.triggerCodeAnalysis(value, activeFilePath);
      
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

  // Apply vibe decorations to Monaco editor
  useEffect(() => {
    if (editorRef.current && activeFilePath) {
      const fileVibes = vibes.filter(vibe => vibe.filePath === activeFilePath);
      
      const newDecorations = fileVibes.map(vibe => {
        let className = '';
        switch (vibe.type) {
          case 'performance':
            className = 'vibe-decoration-performance';
            break;
          case 'refactor':
            className = 'vibe-decoration-refactor';
            break;
          case 'bug':
            className = 'vibe-decoration-bug';
            break;
          case 'style':
            className = 'vibe-decoration-style';
            break;
        }
        
        return {
          range: new (window as any).monaco.Range(
            vibe.lineStart,
            1,
            vibe.lineEnd,
            1
          ),
          options: {
            isWholeLine: true,
            className,
            hoverMessage: {
              value: `**${vibe.agent}:** ${vibe.message}${vibe.suggestion ? `\n\n💡 ${vibe.suggestion}` : ''}`,
            },
          },
        };
      });

      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );
    }
    
    return () => {
      if (editorRef.current) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
    };
  }, [vibes, activeFilePath]);

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

  /**
   * Open a file and optionally focus a specific line for quick navigation.
   *
   * @param path - File path to load.
   * @param line - Optional line number for cursor placement.
   */
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

  /**
   * Prompt the user for a project name and create a new project entry.
   */
  const handleNewProject = () => {
    const name = prompt('Project name:');
    if (name) {
      createProject(name);
      setShowProjectMenu(false);
    }
  };

  /**
   * Switch the active project context and reset project menu state.
   *
   * @param projectId - Identifier of project to activate.
   */
  const handleProjectSwitch = (projectId: string) => {
    setActiveProject(projectId);
    setActiveFilePath(null);
    setShowProjectMenu(false);
  };

  /**
   * Launch native dialog to select a project directory and import it.
   */
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
            showToast({
              variant: 'error',
              title: 'Failed to open project',
              message: `Failed to open project from ${path}`,
            });
          }
        }
      } catch (error) {
        console.error('Failed to open project:', error);
        showToast({
          variant: 'error',
          title: 'Failed to open project',
          message: (error as Error).message,
        });
      }
    } else {
      showToast({
        variant: 'info',
        title: 'File dialogs unavailable',
        message: 'File dialogs are only available in the Electron app',
      });
    }
  };

  /**
   * Apply Turbo Edit output to the current selection or entire file and persist state.
   *
   * @param editedCode - Replacement source code produced by Turbo Edit.
   */
  const handleTurboEditApply = (editedCode: string) => {
    if (activeFilePath && editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection) {
        // Replace selected text
        editorRef.current.executeEdits('turbo-edit', [{
          range: selection,
          text: editedCode,
        }]);
      } else {
        // Replace entire file
        editorRef.current.setValue(editedCode);
      }
      setFileContent(editedCode);
      setUnsavedChanges(true);
      setShowTurboEdit(false);
      addActivity('ai', 'turbo-edit', `Applied Turbo Edit to ${activeFilePath.split('/').pop()}`);
    }
  };

  const fileCount = activeProject?.files.length ?? 0;
  const activeFileName = activeFilePath?.split('/').pop() ?? 'No file selected';
  const saveStateLabel = useMemo(() => {
    if (saveStatus === 'saving') return 'Saving…';
    if (unsavedChanges) return 'Unsaved';
    return 'Synced';
  }, [saveStatus, unsavedChanges]);

  const heroStats = useMemo(() => [
    { icon: '🧠', value: activeProject?.name ?? '—', label: 'Active Project' },
    { icon: '📁', value: fileCount, label: 'Files Indexed' },
    { icon: '⚡', value: saveStateLabel, label: 'Save State' },
  ], [activeProject?.name, fileCount, saveStateLabel]);

  const heroIndicators = useMemo(() => [
    {
      label: showAIAssistant ? 'AI Co-Pilot Online' : 'AI Co-Pilot Offline',
      status: showAIAssistant ? 'online' as const : 'offline' as const,
    },
    {
      label: unsavedChanges ? 'Autosave Pending' : 'Autosave Stable',
      status: unsavedChanges ? 'warning' as const : 'online' as const,
    },
    {
      label: activeFilePath ? `Editing ${activeFileName}` : 'Awaiting file selection',
      status: activeFilePath ? 'online' as const : 'warning' as const,
    },
  ], [showAIAssistant, unsavedChanges, activeFilePath, activeFileName]);

  if (!activeProject) {
    return (
      <div className="vibe-editor">
        <div className="welcome-screen">
          <div className="welcome-logo">
            <img 
              src="/vibdee-logo.svg" 
              alt="VibeEditor" 
              onError={(e) => {
                // Fallback if logo fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
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
    <div className="vibdee-editor build-workflow">
      <WorkflowHero
        title="Build & Refine"
        subtitle={activeProject ? `Live inside ${activeProject.name}` : 'Select a project to begin'}
        stats={heroStats}
        statusIndicators={heroIndicators}
      />

      <div className="build-command-row">
        <CommandCard variant="violet" clickable onClick={() => setShowAIAssistant(true)}>
          <div className="command-card-body">
            <div className="card-icon">
              <TechIcon icon={Brain} size={20} glow="violet" animated />
            </div>
            <div className="card-copy">
              <h3>Start AI Pairing</h3>
              <p>Summon Ed to co-write, refactor, or explain the active file.</p>
            </div>
            <span className="card-hint">⌘⇧A</span>
          </div>
        </CommandCard>

        <CommandCard variant="cyan" clickable onClick={() => setShowProjectSearch(true)}>
          <div className="command-card-body">
            <div className="card-icon">
              <TechIcon icon={ICON_MAP.search} size={20} glow="cyan" />
            </div>
            <div className="card-copy">
              <h3>Project Graph Search</h3>
              <p>Jump across files, symbols, and references with full context.</p>
            </div>
            <span className="card-hint">⌘⇧F</span>
          </div>
        </CommandCard>

        <CommandCard variant="amber" clickable onClick={handleNewProject}>
          <div className="command-card-body">
            <div className="card-icon">
              <TechIcon icon={ICON_MAP.plus} size={20} glow="amber" />
            </div>
            <div className="card-copy">
              <h3>Spin Up Sandbox</h3>
              <p>Launch a fresh project playground without leaving flow.</p>
            </div>
            <span className="card-hint">New Project</span>
          </div>
        </CommandCard>
      </div>

      <div className="editor-shell glass-panel">
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
              <div className="toolbar-actions">
                <button
                  className="icon-btn"
                  onClick={() => {
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
                      } else {
                        const fullText = editorRef.current.getValue();
                        setSelectedCode(fullText);
                        setShowTurboEdit(true);
                      }
                    }
                  }}
                  title="Turbo Edit (Ctrl+Shift+E)"
                >
                  <TechIcon icon={Zap} size={18} glow="cyan" />
                </button>
              </div>
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
                onMount={(editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
                  editorRef.current = editor;
                  // Store monaco globally for decorations
                  (window as any).monaco = monaco;
                  
                  // Define and apply custom theme
                  monaco.editor.defineTheme('VibeDSTheme', VibeDSTheme);
                  monaco.editor.setTheme('VibeDSTheme');
                }}
                theme="VibeDSTheme"
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
      </div>

      {showProjectSearch && (
        <ProjectSearch
          onClose={() => setShowProjectSearch(false)}
          onFileSelect={handleFileSelect}
        />
      )}

      {showTurboEdit && (
        <div className="modal-overlay" onClick={() => setShowTurboEdit(false)}>
          <div className="modal-content turbo-edit-modal-wrapper" onClick={(e) => e.stopPropagation()}>
            <TurboEdit
              selectedCode={selectedCode}
              filePath={activeFilePath || undefined}
              onApply={handleTurboEditApply}
              onCancel={() => setShowTurboEdit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VibeEditor;
