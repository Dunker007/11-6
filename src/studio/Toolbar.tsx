/**
 * Studio Toolbar
 * Provides quick action buttons for project execution
 */

import { useState } from 'react';
import { useProjectStore } from '../services/project/projectStore';
import { useWebContainerStore } from '../core/webcontainer/webContainerStore';
import '../styles-new/toolbar.css';

interface ToolbarProps {
  onOutput?: (output: string) => void;
}

export default function Toolbar({ onOutput }: ToolbarProps) {
  const { activeProject } = useProjectStore();
  const {
    isInitializing,
    isExecuting,
    error: webContainerError,
    installDependencies,
    startDevServer,
    buildProject,
    runTests
  } = useWebContainerStore();

  const [lastAction, setLastAction] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const handleInstallDeps = async () => {
    if (!activeProject) return;

    setLastAction('Installing dependencies...');
    setActionError(null);

    try {
      const result = await installDependencies(activeProject.id);

      if (result.success) {
        const output = `✅ Dependencies installed successfully!\n\n${result.output || 'No output'}\n\nDuration: ${(result.duration / 1000).toFixed(2)}s`;
        onOutput?.(output);
      } else {
        const errorMsg = `❌ Failed to install dependencies\n\n${result.error || 'Unknown error'}\n\nExit code: ${result.exitCode ?? 'N/A'}`;
        setActionError(errorMsg);
        onOutput?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = `❌ Error installing dependencies: ${(error as Error).message}\n\nMake sure:\n- WebContainer is initialized\n- Project has a package.json file\n- You have an active internet connection`;
      setActionError(errorMsg);
      onOutput?.(errorMsg);
    } finally {
      setLastAction('');
    }
  };

  const handleStartDev = async () => {
    if (!activeProject) return;

    setLastAction('Starting dev server...');
    setActionError(null);

    try {
      const result = await startDevServer(activeProject.id);

      if (result.success) {
        const output = `✅ Dev server started!\n\n${result.output || 'Server is running'}\n\n🌐 Server should be available at http://localhost:3000\n\nDuration: ${(result.duration / 1000).toFixed(2)}s`;
        onOutput?.(output);
      } else {
        const errorMsg = `❌ Failed to start dev server\n\n${result.error || 'Unknown error'}\n\nExit code: ${result.exitCode ?? 'N/A'}\n\nMake sure:\n- Dependencies are installed (run Install first)\n- package.json has a "dev" script`;
        setActionError(errorMsg);
        onOutput?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = `❌ Error starting dev server: ${(error as Error).message}\n\nMake sure:\n- WebContainer is initialized\n- Dependencies are installed\n- Project has a valid dev script`;
      setActionError(errorMsg);
      onOutput?.(errorMsg);
    } finally {
      setLastAction('');
    }
  };

  const handleBuild = async () => {
    if (!activeProject) return;

    setLastAction('Building project...');
    setActionError(null);

    try {
      const result = await buildProject(activeProject.id);

      if (result.success) {
        const output = `✅ Build completed successfully!\n\n${result.output || 'Build output'}\n\nDuration: ${(result.duration / 1000).toFixed(2)}s`;
        onOutput?.(output);
      } else {
        const errorMsg = `❌ Build failed\n\n${result.error || 'Unknown error'}\n\nExit code: ${result.exitCode ?? 'N/A'}\n\nCheck:\n- Build errors in output above\n- package.json has a "build" script\n- All dependencies are installed`;
        setActionError(errorMsg);
        onOutput?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = `❌ Error building project: ${(error as Error).message}\n\nMake sure:\n- WebContainer is initialized\n- Project has a build script\n- All dependencies are installed`;
      setActionError(errorMsg);
      onOutput?.(errorMsg);
    } finally {
      setLastAction('');
    }
  };

  const handleRunTests = async () => {
    if (!activeProject) return;

    setLastAction('Running tests...');
    setActionError(null);

    try {
      const result = await runTests(activeProject.id);

      if (result.success) {
        const output = `✅ Tests passed!\n\n${result.output || 'All tests passed'}\n\nDuration: ${(result.duration / 1000).toFixed(2)}s`;
        onOutput?.(output);
      } else {
        const errorMsg = `❌ Tests failed\n\n${result.error || result.output || 'Unknown error'}\n\nExit code: ${result.exitCode ?? 'N/A'}\n\nCheck:\n- Test failures in output above\n- package.json has a "test" script\n- Test files exist in the project`;
        setActionError(errorMsg);
        onOutput?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = `❌ Error running tests: ${(error as Error).message}\n\nMake sure:\n- WebContainer is initialized\n- Project has a test script\n- Test dependencies are installed`;
      setActionError(errorMsg);
      onOutput?.(errorMsg);
    } finally {
      setLastAction('');
    }
  };

  if (!activeProject) {
    return (
      <div className="toolbar">
        <div className="toolbar-message">
          Select a project to access run tools
        </div>
      </div>
    );
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h4>Project Actions</h4>
        <div className="toolbar-buttons">
          <button
            onClick={handleInstallDeps}
            disabled={isInitializing || isExecuting}
            className="toolbar-btn install-btn"
            title="Install project dependencies"
          >
            📦 Install
          </button>

          <button
            onClick={handleStartDev}
            disabled={isInitializing || isExecuting}
            className="toolbar-btn dev-btn"
            title="Start development server"
          >
            ▶️ Dev
          </button>

          <button
            onClick={handleBuild}
            disabled={isInitializing || isExecuting}
            className="toolbar-btn build-btn"
            title="Build for production"
          >
            🔨 Build
          </button>

          <button
            onClick={handleRunTests}
            disabled={isInitializing || isExecuting}
            className="toolbar-btn test-btn"
            title="Run tests"
          >
            🧪 Test
          </button>
        </div>
      </div>

      {(isInitializing || isExecuting || lastAction) && (
        <div className="toolbar-status">
          {isInitializing && <span>🔄 Initializing WebContainer...</span>}
          {isExecuting && <span>⚙️ Executing...</span>}
          {lastAction && <span>🔄 {lastAction}</span>}
        </div>
      )}

      {(webContainerError || actionError) && (
        <div className="toolbar-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">
            {webContainerError || actionError}
          </span>
        </div>
      )}
    </div>
  );
}
