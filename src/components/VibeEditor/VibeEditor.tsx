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
import type { editor } from 'monaco-editor';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { errorContext } from '../../services/errors/errorContext';
import { useToast } from '@/components/ui';
import { semanticIndexService } from '@/services/ai/semanticIndexService';
import FileExplorer from './FileExplorer';
import TurboEdit from './TurboEdit';
import AIAssistant from '../AIAssistant/AIAssistant';
import ProjectSearch from '../ProjectSearch/ProjectSearch';
import SplitView from './SplitView';
import CodeFlowOverlay from './CodeFlowOverlay';
import { codeFlowService } from '@/services/ai/codeFlowService';
import QuickFileSwitcher from './QuickFileSwitcher';
import TerminalPanel from './TerminalPanel';
import ProjectLoader from './ProjectLoader';
import { useTabStore } from '@/services/editor/tabStore';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { Save, Search, Sliders, ChevronDown, Brain, Sparkles, FolderOpen, Plus, Check, Zap, Eye } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import AIInsightsPanel from './AIInsightsPanel';
import { codebaseInsightsService } from '@/services/ai/codebaseInsightsService';
import { insightsHeuristicsService } from '@/services/ai/insightsHeuristicsService';
import WorkflowHero from '../shared/WorkflowHero';
import CommandCard from '../shared/CommandCard';
import '../../styles/VibeEditor.css';
import SettingsFlyout from './SettingsFlyout';
import { useSettingsStore } from '@/services/settings/settingsStore';

/**
 * Core editor workspace combining Monaco, project management, and AI copilots.
 *
 * @returns Full Vibe Editor experience for active projects.
 */
function VibeEditor() {
  const { activeProject, projects, loadProjects, createProject, setActiveProject, updateFile, setActiveFile } = useProjectStore();
  const { addActivity } = useActivityStore();
  const { showToast } = useToast();
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showProjectSearch, setShowProjectSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTurboEdit, setShowTurboEdit] = useState(false);
  const [showQuickFileSwitcher, setShowQuickFileSwitcher] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCodeFlow, setShowCodeFlow] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [insightsText, setInsightsText] = useState<string | null>(null);
  const codeFlowData = useMemo(() => codeFlowService.buildGraph(), [activeProject, activeFilePath]);
  const [selectedCode, setSelectedCode] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const { openTab, setActiveTab, activeTabId } = useTabStore();
  const { enableHotkeys, defaultSplit } = useSettingsStore();

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

      // Ctrl+S: Manual save - handled by EditorPane
      if (ctrlKey && e.key === 's') {
        e.preventDefault();
        // Save is handled automatically by EditorPane component
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

      // Ctrl+Alt+P: Quick file switcher (Windows-safe)
      if (ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowQuickFileSwitcher(true);
      }

      // Ctrl+`: Toggle terminal
      if (ctrlKey && e.key === '`') {
        e.preventDefault();
        setShowTerminal(!showTerminal);
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

    if (enableHotkeys) {
      window.addEventListener('keydown', handleKeyboard);
      return () => window.removeEventListener('keydown', handleKeyboard);
    }
  }, [activeFilePath, unsavedChanges, updateFile, showAIAssistant, enableHotkeys]);

  useEffect(() => {
    if (activeFilePath && activeProject) {
      setActiveFile(activeFilePath);
      setUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Start semantic indexing for the project
      semanticIndexService.startIndexingForCurrentProject().catch(err => {
        console.warn('Semantic indexing failed:', err);
      });
    }
  }, [activeFilePath, activeProject, setActiveFile]);

  // Editor change handling, decorations, and ESLint are now in EditorPane component

  /**
   * Open a file and optionally focus a specific line for quick navigation.
   *
   * @param path - File path to load.
   * @param line - Optional line number for cursor placement.
   */
  const handleFileSelect = (path: string, line?: number) => {
    // Use new tab system
    const tabId = openTab(path);
    setActiveTab(tabId);
    setActiveFilePath(path);
    
    // Scroll to line if provided (will be handled by EditorPane)
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
    if ((window as any).dialogs) {
      try {
        const result = await (window as any).dialogs.openDirectory();
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
    if (activeFilePath) {
      const { updateTabContent } = useTabStore.getState();
      const activeTab = useTabStore.getState().getTab(activeTabId || '');
      
      if (activeTab) {
        updateTabContent(activeTab.id, editedCode, true);
      }
      
      updateFile(activeFilePath, editedCode);
      setUnsavedChanges(true);
      setSaveStatus('saving');
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
            {/* Browser-friendly loader (Sandbox / Import / Drag&Drop) */}
            <div style={{ marginTop: 12 }}>
              <ProjectLoader onProjectLoaded={() => { /* refresh */ }} />
            </div>
          </div>
          {/* Recent sandboxes */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ color: 'var(--text-primary,#fff)', marginBottom: 8 }}>Recent Sandboxes</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {projects
                .filter(p => p.rootPath?.startsWith('/'))
                .slice(-6)
                .reverse()
                .map(p => (
                  <button
                    key={p.id}
                    className="action-button"
                    onClick={() => { setActiveProject(p.id); }}
                    title={`Open ${p.name}`}
                  >
                    <TechIcon icon={FolderOpen} size={16} glow="none" />
                    <span>{p.name}</span>
                  </button>
                ))
              }
              {projects.filter(p => p.rootPath?.startsWith('/')).length === 0 && (
                <div style={{ color: 'var(--text-secondary,rgba(255,255,255,0.7))' }}>
                  No recent sandbox projects yet. Create one with the folder button above.
                </div>
              )}
            </div>
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
        {/* Project Loader: Browser-friendly open/sandbox/drag-drop */}
        <div className="command-inline">
          <ProjectLoader onProjectLoaded={() => { /* refresh if needed */ }} />
        </div>
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
            <div className="editor-toolbar">
              <div className="toolbar-actions">
                <button
                  className="icon-btn"
                  onClick={() => setShowQuickFileSwitcher(true)}
                  title="Quick File Switcher (Ctrl+Alt+P)"
                >
                  <TechIcon icon={Search} size={18} glow="cyan" />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setShowGlobalSearch(true)}
                  title="Global Search (content)"
                >
                  <TechIcon icon={Eye} size={18} glow="none" />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setShowCodeFlow(true)}
                  title="Show Code Flow"
                >
                  <TechIcon icon={ICON_MAP.layers} size={18} glow="cyan" />
                </button>
                <button
                  className="icon-btn"
                  onClick={async () => {
                    setShowInsights(true);
                    let txt = await codebaseInsightsService.summarizeProject();
                    if (!txt) txt = insightsHeuristicsService.summarize();
                    setInsightsText(txt);
                  }}
                  title="AI/Heuristic Insights"
                >
                  <TechIcon icon={Brain} size={18} glow="violet" />
                </button>
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
                {activeTabId && (() => {
                  const activeTab = useTabStore.getState().getTab(activeTabId);
                  return activeTab ? (
                    <>
                      <span className="language-badge">{activeTab.language || 'plaintext'}</span>
                      <span className="separator">|</span>
                      <span className="line-info">{activeTab.name}</span>
                    </>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          <div className="editor-content">
            <SplitView />
          </div>
        </div>

        {showAIAssistant && (
          <div className="ai-assistant-panel">
            <AIAssistant />
          </div>
        )}
        </div>
      </div>

      {showTerminal && (
        <TerminalPanel
          isVisible={showTerminal}
          onToggle={() => setShowTerminal(!showTerminal)}
        />
      )}

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

      {showQuickFileSwitcher && (
        <QuickFileSwitcher
          isOpen={showQuickFileSwitcher}
          onClose={() => setShowQuickFileSwitcher(false)}
          onFileSelect={handleFileSelect}
        />
      )}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onOpenFile={(p, split) => {
          if (split) {
            const st = useTabStore.getState();
            const sv = st.splitView;
            const activePaneId = sv?.activePaneId;
            if (!sv || !activePaneId) {
              const id = st.openTab(p); st.setActiveTab(id);
            } else {
              st.splitPane(activePaneId, defaultSplit);
              setTimeout(() => {
                const after = useTabStore.getState().splitView;
                const findSibling = (pane: any, targetId: string): string | null => {
                  if (pane.children && pane.children.length === 2) {
                    const [c0,c1] = pane.children;
                    if (c0.id===targetId) return c1.id;
                    if (c1.id===targetId) return c0.id;
                  }
                  if (pane.children) {
                    for (const c of pane.children) {
                      const r = findSibling(c, targetId);
                      if (r) return r;
                    }
                  }
                  return null;
                };
                const target = after ? findSibling(after.rootPane, activePaneId) || after.activePaneId : null;
                const id = st.openTab(p);
                if (target && st.moveTabToPane) st.moveTabToPane(id, target);
                st.setActiveTab(id);
              }, 0);
            }
          } else {
            const id = useTabStore.getState().openTab(p);
            useTabStore.getState().setActiveTab(id);
          }
          handleFileSelect(p);
          setShowGlobalSearch(false);
        }}
        onRevealInSidebar={(p) => {
          setActiveFilePath(p);
        }}
      />
      <CodeFlowOverlay
        visible={showCodeFlow}
        data={{
          nodes: codeFlowData.nodes.map(n => ({ id: n.id, label: n.label, filePath: n.filePath })),
          edges: codeFlowData.edges.map(e => ({ from: e.from, to: e.to })),
        }}
        onClose={() => setShowCodeFlow(false)}
        onNodeClick={(path) => {
          setShowCodeFlow(false);
          handleFileSelect(path);
        }}
        onOpenInSplit={(p) => {
          const st = useTabStore.getState();
          const sv = st.splitView;
          const activePaneId = sv?.activePaneId;
          if (!sv || !activePaneId) {
            const tabId = st.openTab(p);
            st.setActiveTab(tabId);
            setShowCodeFlow(false);
            return;
          }
          const currentActive = activePaneId;
          st.splitPane(currentActive, defaultSplit);
          setTimeout(() => {
            const after = useTabStore.getState().splitView;
            if (!after) {
              const id = st.openTab(p);
              st.setActiveTab(id);
              setShowCodeFlow(false);
              return;
            }
            const findSibling = (pane: any, targetId: string): string | null => {
              if (pane.children && pane.children.length === 2) {
                const [c0, c1] = pane.children;
                if (c0.id === targetId) return c1.id;
                if (c1.id === targetId) return c0.id;
              }
              if (pane.children) {
                for (const c of pane.children) {
                  const res = findSibling(c, targetId);
                  if (res) return res;
                }
              }
              return null;
            };
            const targetPaneId = findSibling(after.rootPane, currentActive) || after.activePaneId;
            const newTabId = st.openTab(p);
            if (targetPaneId && st.moveTabToPane) {
              st.moveTabToPane(newTabId, targetPaneId);
            }
            st.setActiveTab(newTabId);
            setShowCodeFlow(false);
          }, 0);
        }}
      />
      <AIInsightsPanel
        visible={showInsights}
        onClose={() => setShowInsights(false)}
        insights={insightsText}
        callGraph={[]}
        coverage={null}
        deps={[]}
      />
      <SettingsFlyout visible={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default VibeEditor;
