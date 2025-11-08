import { useState, useEffect } from 'react';
import { useCreatorStore } from '../../services/creator/creatorStore';
import { useActivityStore } from '../../services/activity/activityStore';
import TechIcon from '../Icons/TechIcon';
import { PenTool, Plus, FileText, Book, Library, Save, Download, Eye } from 'lucide-react';
import '../../styles/Creator.css';

function Creator() {
  const { documents, templates, currentDocument, loadDocuments, loadTemplates, createDocument, selectDocument, updateDocument, deleteDocument } =
    useCreatorStore();
  const { addActivity } = useActivityStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
    loadTemplates();
  }, [loadDocuments, loadTemplates]);

  const handleCreate = () => {
    if (newDocTitle.trim()) {
      createDocument(newDocTitle.trim(), 'markdown', selectedTemplate || undefined);
      addActivity('file', 'created', `Created document "${newDocTitle.trim()}"`);
      setNewDocTitle('');
      setSelectedTemplate(null);
      setShowCreateDialog(false);
    }
  };

  return (
    <div className="creator-container">
      <div className="creator-header">
        <h2>Creator</h2>
        <button onClick={() => setShowCreateDialog(true)} className="create-btn">
          <TechIcon icon={Plus} size={18} glow="cyan" />
          <span>New Document</span>
        </button>
      </div>

      {showCreateDialog && (
        <div className="modal-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Document</h3>
            <input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Document title..."
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="templates-list">
              <label>Templates (optional):</label>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`template-option ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                >
                  {template.category === 'blog' ? (
                    <TechIcon icon={FileText} size={20} glow="cyan" className="template-icon" />
                  ) : template.category === 'readme' ? (
                    <TechIcon icon={Book} size={20} glow="violet" className="template-icon" />
                  ) : (
                    <TechIcon icon={Library} size={20} glow="amber" className="template-icon" />
                  )}
                  <div>
                    <div className="template-name">{template.name}</div>
                    <div className="template-desc">{template.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={handleCreate} className="confirm-btn" disabled={!newDocTitle.trim()}>
                Create
              </button>
              <button onClick={() => setShowCreateDialog(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="creator-content">
        {documents.length === 0 ? (
          <div className="empty-state">
            <TechIcon icon={PenTool} size={64} glow="violet" animated={false} className="empty-icon" />
            <h3>No Documents</h3>
            <p>Create your first document to get started</p>
          </div>
        ) : (
          <div className="creator-layout">
            <div className="documents-sidebar">
              <h3>Documents</h3>
              <div className="documents-list">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`document-item ${currentDocument?.id === doc.id ? 'active' : ''}`}
                    onClick={() => selectDocument(doc.id)}
                  >
                    <div className="document-item-header">
                      <span className="document-title">{doc.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                          addActivity('file', 'deleted', `Deleted document "${doc.title}"`);
                        }}
                        className="delete-doc-btn"
                        title="Delete Document"
                      >
                        <TechIcon icon={FileText} size={12} glow="none" />
                      </button>
                    </div>
                    <div className="document-item-meta">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {currentDocument && (
              <div className="editor-panel">
                <div className="editor-header">
                  <input
                    type="text"
                    value={currentDocument.title}
                    onChange={(e) => updateDocument(currentDocument.id, { title: e.target.value })}
                    className="title-input"
                  />
                </div>
                <textarea
                  value={currentDocument.content}
                  onChange={(e) => updateDocument(currentDocument.id, { content: e.target.value })}
                  className="content-editor"
                  placeholder="Start writing..."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Creator;

