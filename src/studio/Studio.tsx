import { useState, useEffect } from 'react';
import Editor from './Editor';
import ProjectPanel from './ProjectPanel';
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import ConsolePanel from './ConsolePanel';
import HWStatus from './HWStatus';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
// CommandPalette component has been removed
import { useProjectStore } from '../core/project/projectStore';
import { useWebContainerStore } from '../core/webcontainer/webContainerStore';
import { projectService } from '../core/project/projectService';
import { aiServiceBridge } from '../core/ai/aiServiceBridge';
import { llmRouter } from '../services/ai/router';
import { apiKeyService } from '../services/apiKeys/apiKeyService';
import '../styles-new/studio.css';

function Studio() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [_webContainerError, setWebContainerError] = useState<string | null>(null);
  const { activeProject, projects, loadProjects } = useProjectStore();
  const { initializeContainer, loadProjectFromService } = useWebContainerStore();

  useEffect(() => {
    // Load projects on studio startup
    loadProjects();

    // Auto-configure Gemini Flash 2.5 when Studio opens
    const configureGemini = async () => {
      try {
        // Ensure API keys are initialized before checking
        await apiKeyService.ensureInitialized();
        // Check if Gemini API key is available
        const geminiKey = await apiKeyService.getKeyForProviderAsync('gemini');
        if (geminiKey) {
          // Set Studio context to prioritize Gemini
          llmRouter.setStudioContext(true);
          // Set Gemini as preferred provider
          llmRouter.setPreferredProvider('gemini');
          console.log('Studio: Gemini Flash 2.5 configured as default provider');
        } else {
          console.log('Studio: Gemini API key not found, using default provider strategy');
        }
      } catch (error) {
        console.error('Studio: Failed to configure Gemini:', error);
      }
    };

    configureGemini();

    // Cleanup: Reset Studio context when component unmounts
    return () => {
      llmRouter.setStudioContext(false);
    };
  }, [loadProjects]);

  // Auto-start project indexing when active project changes
  useEffect(() => {
    if (activeProject) {
      // Start AI indexing for context awareness
      aiServiceBridge.startIndexing(activeProject.rootPath || '').catch(console.error);
    }
  }, [activeProject]);

  // Auto-initialize WebContainer and load project files when project is selected
  useEffect(() => {
    if (!activeProject) return;

    let cancelled = false;

    const initializeWebContainer = async () => {
      try {
        setWebContainerError(null);
        
        // Initialize WebContainer for this project
        await initializeContainer(activeProject.id);
        
        if (cancelled) return;

        // Load project files into WebContainer
        await loadProjectFromService(activeProject.id, projectService);
        
        if (cancelled) return;

        console.log(`WebContainer ready for project: ${activeProject.name}`);
      } catch (error) {
        if (cancelled) return;
        
        const errorMessage = (error as Error).message;
        setWebContainerError(errorMessage);
        console.error('Failed to initialize WebContainer:', error);
        
        // Show error in console panel
        setCommandOutput(`⚠️ WebContainer initialization failed: ${errorMessage}\n\nThis may happen if:\n- WebContainer API is not available\n- Project files are missing\n- Browser doesn't support WebContainer\n\nYou can still edit files, but execution features may be limited.`);
        setConsoleVisible(true);
      }
    };

    initializeWebContainer();

    return () => {
      cancelled = true;
    };
  }, [activeProject?.id, initializeContainer, loadProjectFromService]);

  // Command palette keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  const activeProjectId = activeProject?.id || null;

  return (
    <ErrorBoundary sectionName="Studio">
      <div className="studio">
      <TopBar
        activeProject={activeProject}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="studio-main">
        {sidebarOpen && (
          <div className="studio-sidebar">
            <ProjectPanel
              activeProject={activeProjectId}
              onProjectSelect={(projectId) => {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                  useProjectStore.getState().setActiveProject(projectId);
                }
              }}
            />
          </div>
        )}

        <div className="studio-content">
          <HWStatus />
          <Editor projectId={activeProjectId} />
        </div>
      </div>

      <ConsolePanel
        output={commandOutput}
        isVisible={consoleVisible}
        onToggle={() => setConsoleVisible(!consoleVisible)}
        onClear={() => setCommandOutput('')}
      />

      <Toolbar
        onOutput={(output) => {
          setCommandOutput(output);
          setConsoleVisible(true); // Auto-show console when there's output
          console.log('Command output:', output);
        }}
      />

      {/* CommandPalette component has been removed */}
    </div>
    </ErrorBoundary>
  );
}

export default Studio;
