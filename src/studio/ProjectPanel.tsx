import React, { useState } from 'react';
import { useProjectStore } from '../core/project/projectStore';
import { useFileSystemStore } from '../core/filesystem/fileSystemStore';
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
  const { projects, createProject } = useProjectStore();
  const { openDirectoryDialog } = useFileSystemStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'layouts'>('projects');
  const [previewMockup, setPreviewMockup] = useState<MockupType | null>(null);

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
    try {
      console.log('Opening directory dialog...');

      if (!openDirectoryDialog) {
        console.error('openDirectoryDialog function not available');
        alert('Drive access not available - make sure you\'re running the Electron app');
        return;
      }

      const directories = await openDirectoryDialog();
      console.log('Dialog result:', directories);

      if (directories && directories.length > 0) {
        const projectPath = directories[0];
        const projectName = projectPath.split(/[/\\]/).pop() || 'Imported Project';

        console.log('Creating project for path:', projectPath);

        // Create studio project from real directory
        const project = createProject(`${projectName} (Drive)`);
        onProjectSelect(project.id);

        console.log('Opened project from drive:', projectPath, 'Project ID:', project.id);
      } else {
        console.log('No directory selected');
      }
    } catch (error) {
      console.error('Failed to open project from drive:', error);
      alert('Failed to open directory: ' + (error as Error).message);
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
            >
              📂 Open
            </button>
          </div>

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
