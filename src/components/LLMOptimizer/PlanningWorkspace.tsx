// src/components/LLMOptimizer/PlanningWorkspace.tsx
import { useState } from 'react';
import { FileText, Map, Calendar, Layout, BookOpen, Lightbulb } from 'lucide-react';
import { Idea } from '@/services/idea/ideaInventoryService';
import '../../styles/LLMOptimizer.css';

interface PlanningWorkspaceProps {
  selectedIdea: Idea | null;
}

type WorkspaceView = 'detail' | 'canvas' | 'mindmap' | 'timeline' | 'notes' | 'notebooklm';

function PlanningWorkspace({ selectedIdea }: PlanningWorkspaceProps) {
  const [activeView, setActiveView] = useState<WorkspaceView>('detail');

  if (!selectedIdea) {
    return (
      <div className="planning-workspace-empty">
        <div className="empty-workspace-content">
          <Lightbulb size={48} className="empty-icon" />
          <h3>Select an idea to start planning</h3>
          <p>Choose an idea from the left panel to view details and start planning</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-workspace">
      {/* View Selector */}
      <div className="workspace-view-selector">
        <button
          className={`view-btn ${activeView === 'detail' ? 'active' : ''}`}
          onClick={() => setActiveView('detail')}
          title="Idea Details"
        >
          <FileText size={18} />
          <span>Details</span>
        </button>
        <button
          className={`view-btn ${activeView === 'canvas' ? 'active' : ''}`}
          onClick={() => setActiveView('canvas')}
          title="Planning Canvas"
        >
          <Layout size={18} />
          <span>Canvas</span>
        </button>
        <button
          className={`view-btn ${activeView === 'mindmap' ? 'active' : ''}`}
          onClick={() => setActiveView('mindmap')}
          title="Mind Map"
        >
          <Map size={18} />
          <span>Mind Map</span>
        </button>
        <button
          className={`view-btn ${activeView === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveView('timeline')}
          title="Timeline"
        >
          <Calendar size={18} />
          <span>Timeline</span>
        </button>
        <button
          className={`view-btn ${activeView === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveView('notes')}
          title="Notes"
        >
          <FileText size={18} />
          <span>Notes</span>
        </button>
        <button
          className={`view-btn ${activeView === 'notebooklm' ? 'active' : ''}`}
          onClick={() => setActiveView('notebooklm')}
          title="NotebookLM Research"
        >
          <BookOpen size={18} />
          <span>Research</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="workspace-content">
        {activeView === 'detail' && (
          <div className="idea-detail-view">
            <div className="idea-detail-header">
              <h2>{selectedIdea.title}</h2>
              <span className={`status-badge ${selectedIdea.status}`}>
                {selectedIdea.status}
              </span>
            </div>
            <div className="idea-detail-body">
              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedIdea.description}</p>
              </div>
              <div className="detail-section">
                <h3>Topic</h3>
                <span className="topic-tag">{selectedIdea.topic}</span>
              </div>
              <div className="detail-section">
                <h3>Source</h3>
                <p className="source-text">{selectedIdea.source}</p>
              </div>
              <div className="detail-section">
                <h3>Created</h3>
                <p>{new Date(selectedIdea.created).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'canvas' && (
          <div className="planning-canvas-view">
            <div className="canvas-placeholder">
              <Layout size={48} className="placeholder-icon" />
              <h3>Planning Canvas</h3>
              <p>Visual planning board coming soon</p>
              <p className="placeholder-hint">Drag ideas here to create a visual plan</p>
            </div>
          </div>
        )}

        {activeView === 'mindmap' && (
          <div className="mindmap-view">
            <div className="canvas-placeholder">
              <Map size={48} className="placeholder-icon" />
              <h3>Mind Map</h3>
              <p>Mind map visualization coming soon</p>
              <p className="placeholder-hint">Visualize connections and relationships</p>
            </div>
          </div>
        )}

        {activeView === 'timeline' && (
          <div className="timeline-view">
            <div className="canvas-placeholder">
              <Calendar size={48} className="placeholder-icon" />
              <h3>Project Timeline</h3>
              <p>Timeline view coming soon</p>
              <p className="placeholder-hint">Plan milestones and deadlines</p>
            </div>
          </div>
        )}

        {activeView === 'notes' && (
          <div className="notes-view">
            <textarea
              className="notes-editor"
              placeholder="Add notes, thoughts, and documentation about this idea..."
              defaultValue={`# ${selectedIdea.title}\n\n${selectedIdea.description}\n\n## Notes\n\n`}
            />
          </div>
        )}

        {activeView === 'notebooklm' && (
          <div className="notebooklm-view">
            <div className="notebooklm-header">
              <h3>NotebookLM Research</h3>
              <p>Research notes and document organization for: {selectedIdea.title}</p>
            </div>
            <div className="notebooklm-content">
              <div className="notebooklm-placeholder">
                <BookOpen size={48} className="placeholder-icon" />
                <h4>NotebookLM Integration</h4>
                <p>Connect to NotebookLM to organize research, documents, and insights related to this idea.</p>
                <button className="connect-notebooklm-btn">
                  Connect NotebookLM
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlanningWorkspace;

