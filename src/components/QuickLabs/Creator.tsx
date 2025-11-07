import { useState, useEffect } from 'react';
import { useCreatorStore } from '../../services/creator/creatorStore';
import '../../styles/Creator.css';

function Creator() {
  const { documents, templates, currentDocument, loadDocuments, loadTemplates, createDocument, selectDocument, updateDocument, deleteDocument } =
    useCreatorStore();

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
          + New Document
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
                  <span className="template-icon">{template.category === 'blog' ? '📝' : template.category === 'readme' ? '📖' : '📚'}</span>
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
                        }}
                        className="delete-doc-btn"
                      >
                        ×
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

