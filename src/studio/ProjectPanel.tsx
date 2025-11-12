import React, { useState } from 'react';
import { useProjectStore } from '../services/project/projectStore';
import { useFileSystemStore } from '../services/filesystem/fileSystemStore';
import { projectService } from '../services/project/projectService';
import FileExplorer from '../components/VibeEditor/FileExplorer';
import LayoutMockupSelector, { type MockupType } from '../components/LayoutPlayground/LayoutMockupSelector';
import MockupPreviewModal from '../components/LayoutPlayground/Mockups/MockupPreviewModal';
import StudioHubMockup from '../components/LayoutPlayground/Mockups/StudioHubMockup';
import LLMRevenueCommandCenterMockup from '../components/LayoutPlayground/Mockups/LLMRevenueCommandCenterMockup';
import BoltAIWorkspaceMockup from '../components/LayoutPlayground/Mockups/BoltAIWorkspaceMockup';
import '../styles-new/project-panel.css';
import '../styles/LayoutMockups.css';

interface ProjectPanelProps {
  activeProject: string | null;
  onProjectSelect: (projectId: string) => void;
}

function ProjectPanel({ activeProject, onProjectSelect }: ProjectPanelProps) {
  const { projects, createProject, activeProject: currentProject, activeFile, setActiveFile, loadProjects } = useProjectStore();
  const { openDirectoryDialog } = useFileSystemStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'layouts'>('projects');
  const [previewMockup, setPreviewMockup] = useState<MockupType | null>(null);
  const [isLoadingDriveProject, setIsLoadingDriveProject] = useState(false);
  const [driveProjectError, setDriveProjectError] = useState<string | null>(null);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName.trim());
      onProjectSelect(project.id);
      setNewProjectName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    }
  };

  const openProjectFromDrive = async () => {
    setIsLoadingDriveProject(true);
    setDriveProjectError(null);

    try {
      console.log('Opening directory dialog...');

      if (!openDirectoryDialog) {
        console.error('openDirectoryDialog function not available');
        setDriveProjectError('Drive access not available - make sure you\'re running the Electron app');
        setIsLoadingDriveProject(false);
        return;
      }

      const directories = await openDirectoryDialog();
      console.log('Dialog result:', directories);

      if (directories && directories.length > 0) {
        const projectPath = directories[0];
        console.log('Loading project from disk:', projectPath);

        // Use projectService to open project from disk
        const project = await projectService.openProjectFromDisk(projectPath);

        if (project) {
          // Refresh project list to include the new project
          loadProjects();
          
          // Select the newly loaded project
          onProjectSelect(project.id);
          
          console.log('Successfully loaded project from drive:', projectPath, 'Project ID:', project.id);
        } else {
          setDriveProjectError('Failed to load project from disk. The directory may be empty or inaccessible.');
        }
      } else {
        console.log('No directory selected');
      }
    } catch (error) {
      console.error('Failed to open project from drive:', error);
      setDriveProjectError(`Failed to open directory: ${(error as Error).message}`);
    } finally {
      setIsLoadingDriveProject(false);
    }
  };

  return (
    <div className="project-panel">
      <div className="panel-tabs">
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📁 Projects
        </button>
        <button
          className={`tab-btn ${activeTab === 'layouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('layouts')}
        >
          🎨 Layouts
        </button>
      </div>

      {activeTab === 'projects' ? (
        <>
          <div className="panel-header">
            <h3>Projects</h3>
            <button
              onClick={openProjectFromDrive}
              className="drive-open-button"
              title="Open project from drive"
              disabled={isLoadingDriveProject}
            >
              {isLoadingDriveProject ? '⏳' : '📂'} Open
            </button>
          </div>

          {driveProjectError && (
            <div className="error-message" style={{ 
              padding: 'var(--spacing-sm)', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--accent-red)',
              fontSize: 'var(--font-size-xs)',
              marginBottom: 'var(--spacing-sm)'
            }}>
              {driveProjectError}
              <button 
                onClick={() => setDriveProjectError(null)}
                style={{ 
                  float: 'right', 
                  background: 'none', 
                  border: 'none', 
                  color: 'inherit',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          )}

          <div className="create-project">
            <input
              type="text"
              placeholder="New project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="project-input"
            />
            <button
              onClick={handleCreateProject}
              className="create-button"
              disabled={!newProjectName.trim()}
            >
              +
            </button>
          </div>

          <div className="projects-list">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${activeProject === project.id ? 'active' : ''}`}
                onClick={() => onProjectSelect(project.id)}
              >
                <div className="project-icon">📁</div>
                <div className="project-info">
                  <div className="project-name">{project.name}</div>
                  <div className="project-status">{project.status}</div>
                </div>
              </div>
            ))}
          </div>

          {currentProject && currentProject.files && currentProject.files.length > 0 && (
            <div className="file-explorer-section">
              <div className="file-explorer-header">
                <h4>Files</h4>
              </div>
              <FileExplorer
                files={currentProject.files}
                activeFile={activeFile}
                onFileSelect={(path) => setActiveFile(path)}
              />
            </div>
          )}
        </>
      ) : (
        <div className="layouts-tab-content">
          <LayoutMockupSelector onPreview={setPreviewMockup} />
        </div>
      )}

      {previewMockup && (
        <MockupPreviewModal
          mockupId={previewMockup}
          onClose={() => setPreviewMockup(null)}
          onNavigate={setPreviewMockup}
        >
          {previewMockup === 'studio-hub' && <StudioHubMockup />}
          {previewMockup === 'llm-revenue-command-center' && <LLMRevenueCommandCenterMockup />}
          {previewMockup === 'bolt-ai-workspace' && <BoltAIWorkspaceMockup />}
        </MockupPreviewModal>
      )}
    </div>
  );
}

export default ProjectPanel;
