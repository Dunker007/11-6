/**
 * NotebookLMPanel.tsx
 *
 * PURPOSE:
 * Comprehensive NotebookLM integration panel for document management and AI-powered research.
 * Provides interface for creating notebooks, uploading documents, and querying with Gemini AI.
 *
 * FEATURES:
 * ✅ Create and manage notebooks
 * ✅ Upload documents (text, files, URLs)
 * ✅ View and delete documents
 * ✅ Query notebooks with AI (Gemini API)
 * ✅ View citations and sources
 * ✅ LocalStorage persistence
 * ✅ Real Gemini API integration
 */

import { useState, useEffect, useCallback } from 'react';
import { notebookLMService } from '@/services/ai/notebooklmService';
import type { Notebook, NotebookDocument, NotebookResponse } from '@/types/notebooklm';
import {
  Book,
  Plus,
  Trash2,
  FileText,
  Upload,
  Send,
  RefreshCw,
  ExternalLink,
  Search,
  BookOpen,
} from 'lucide-react';
import '../../styles/NotebookLMPanel.css';

export function NotebookLMPanel() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookDesc, setNewNotebookDesc] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<NotebookResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'query'>('documents');

  // Load notebooks on mount
  useEffect(() => {
    loadNotebooks();
  }, []);

  const loadNotebooks = useCallback(() => {
    const loaded = notebookLMService.getNotebooks();
    setNotebooks(loaded);

    // If selectedNotebook exists, refresh it
    if (selectedNotebook) {
      const updated = loaded.find(n => n.id === selectedNotebook.id);
      if (updated) {
        setSelectedNotebook(updated);
      }
    }
  }, [selectedNotebook]);

  const handleCreateNotebook = useCallback(async () => {
    if (!newNotebookName.trim()) return;

    const notebook = await notebookLMService.createNotebook(
      newNotebookName,
      newNotebookDesc || undefined
    );

    setNotebooks(prev => [...prev, notebook]);
    setSelectedNotebook(notebook);
    setShowCreateModal(false);
    setNewNotebookName('');
    setNewNotebookDesc('');
  }, [newNotebookName, newNotebookDesc]);

  const handleDeleteNotebook = useCallback(async (id: string) => {
    if (!confirm('Delete this notebook? This cannot be undone.')) return;

    await notebookLMService.deleteNotebook(id);
    setNotebooks(prev => prev.filter(n => n.id !== id));

    if (selectedNotebook?.id === id) {
      setSelectedNotebook(null);
      setResponse(null);
    }
  }, [selectedNotebook]);

  const handleUploadDocument = useCallback(async () => {
    if (!selectedNotebook || !uploadTitle.trim()) return;

    const content = uploadContent || uploadUrl;
    if (!content.trim()) return;

    await notebookLMService.uploadDocument(selectedNotebook.id, {
      title: uploadTitle,
      content,
      sourceUrl: uploadUrl || undefined,
      tags: uploadUrl ? ['url'] : ['text'],
    });

    loadNotebooks();
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadContent('');
    setUploadUrl('');
  }, [selectedNotebook, uploadTitle, uploadContent, uploadUrl, loadNotebooks]);

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    if (!selectedNotebook) return;
    if (!confirm('Delete this document?')) return;

    await notebookLMService.removeDocument(selectedNotebook.id, documentId);
    loadNotebooks();
  }, [selectedNotebook, loadNotebooks]);

  const handleQuery = useCallback(async () => {
    if (!selectedNotebook || !query.trim() || isQuerying) return;

    setIsQuerying(true);
    setResponse(null);

    try {
      const result = await notebookLMService.queryNotebook(
        selectedNotebook.id,
        query
      );
      setResponse(result);
    } catch (error) {
      alert(`Query failed: ${(error as Error).message}`);
    } finally {
      setIsQuerying(false);
    }
  }, [selectedNotebook, query, isQuerying]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedNotebook) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      await notebookLMService.uploadDocument(selectedNotebook.id, {
        title: file.name,
        content,
        tags: ['file'],
      });

      loadNotebooks();
    };
    reader.readAsText(file);
  }, [selectedNotebook, loadNotebooks]);

  return (
    <div className="notebooklm-panel">
      {/* Sidebar: Notebook List */}
      <div className="notebooklm-sidebar">
        <div className="sidebar-header">
          <h3>
            <BookOpen size={20} />
            Notebooks
          </h3>
          <button
            className="create-notebook-btn"
            onClick={() => setShowCreateModal(true)}
            title="Create Notebook"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="notebook-list">
          {notebooks.length === 0 ? (
            <div className="empty-notebooks">
              <Book size={32} />
              <p>No notebooks yet</p>
              <button onClick={() => setShowCreateModal(true)}>
                Create First Notebook
              </button>
            </div>
          ) : (
            notebooks.map(notebook => (
              <div
                key={notebook.id}
                className={`notebook-item ${selectedNotebook?.id === notebook.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedNotebook(notebook);
                  setResponse(null);
                }}
              >
                <div className="notebook-info">
                  <Book size={18} />
                  <div className="notebook-details">
                    <h4>{notebook.name}</h4>
                    <p>{notebook.documents.length} documents</p>
                  </div>
                </div>
                <button
                  className="delete-notebook-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotebook(notebook.id);
                  }}
                  title="Delete notebook"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="notebooklm-content">
        {!selectedNotebook ? (
          <div className="no-selection">
            <BookOpen size={64} />
            <h3>Select a notebook to get started</h3>
            <p>Create a notebook to organize documents and ask AI questions</p>
          </div>
        ) : (
          <>
            {/* Notebook Header */}
            <div className="notebook-header">
              <div className="notebook-title">
                <h2>{selectedNotebook.name}</h2>
                {selectedNotebook.description && (
                  <p>{selectedNotebook.description}</p>
                )}
              </div>
              <div className="notebook-stats">
                <span>{selectedNotebook.documents.length} documents</span>
                <span>Updated {new Date(selectedNotebook.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="notebook-tabs">
              <button
                className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <FileText size={16} />
                Documents
              </button>
              <button
                className={`tab-btn ${activeTab === 'query' ? 'active' : ''}`}
                onClick={() => setActiveTab('query')}
              >
                <Search size={16} />
                Query AI
              </button>
            </div>

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="documents-tab">
                <div className="documents-header">
                  <h3>Documents</h3>
                  <div className="document-actions">
                    <label className="file-upload-btn">
                      <Upload size={16} />
                      Upload File
                      <input
                        type="file"
                        accept=".txt,.md,.json,.js,.ts,.tsx,.jsx,.html,.css"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button onClick={() => setShowUploadModal(true)}>
                      <Plus size={16} />
                      Add Document
                    </button>
                  </div>
                </div>

                <div className="documents-list">
                  {selectedNotebook.documents.length === 0 ? (
                    <div className="empty-documents">
                      <FileText size={48} />
                      <p>No documents in this notebook</p>
                      <button onClick={() => setShowUploadModal(true)}>
                        Add First Document
                      </button>
                    </div>
                  ) : (
                    selectedNotebook.documents.map(doc => (
                      <div key={doc.id} className="document-card">
                        <div className="document-header">
                          <div className="document-info">
                            <FileText size={16} />
                            <h4>{doc.title}</h4>
                          </div>
                          <div className="document-actions-icons">
                            {doc.sourceUrl && (
                              <a
                                href={doc.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="doc-link"
                                title="Open source"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="delete-doc-btn"
                              title="Delete document"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="document-meta">
                          <span>{doc.tags.join(', ')}</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="document-preview">
                          {doc.content.substring(0, 200)}...
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Query Tab */}
            {activeTab === 'query' && (
              <div className="query-tab">
                <div className="query-section">
                  <h3>Ask Questions</h3>
                  <p>Query this notebook using AI. The AI will analyze all documents to answer your question.</p>

                  {selectedNotebook.documents.length === 0 ? (
                    <div className="query-warning">
                      <FileText size={24} />
                      <p>Add documents to this notebook before querying</p>
                    </div>
                  ) : (
                    <>
                      <div className="query-input-area">
                        <textarea
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Ask a question about your documents..."
                          rows={3}
                          disabled={isQuerying}
                        />
                        <button
                          onClick={handleQuery}
                          disabled={!query.trim() || isQuerying}
                          className="query-btn"
                        >
                          {isQuerying ? (
                            <>
                              <RefreshCw size={16} className="spinning" />
                              Querying...
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              Ask AI
                            </>
                          )}
                        </button>
                      </div>

                      {response && (
                        <div className="query-response">
                          <h4>Answer</h4>
                          <div className="response-text">{response.text}</div>

                          {response.citations && response.citations.length > 0 && (
                            <div className="citations">
                              <h5>Citations</h5>
                              {response.citations.map((citation, idx) => (
                                <div key={idx} className="citation">
                                  <div className="citation-index">{idx + 1}</div>
                                  <div className="citation-content">
                                    <div className="citation-excerpt">{citation.excerpt}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Notebook Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Notebook</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                placeholder="My Research Notebook"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={newNotebookDesc}
                onChange={(e) => setNewNotebookDesc(e.target.value)}
                placeholder="What is this notebook about?"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={handleCreateNotebook}
                disabled={!newNotebookName.trim()}
                className="create-btn"
              >
                <Plus size={16} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add Document</h3>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Document title"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Content *</label>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="Paste or type document content here..."
                rows={8}
              />
            </div>
            <div className="form-group">
              <label>Source URL (optional)</label>
              <input
                type="url"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowUploadModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={!uploadTitle.trim() || (!uploadContent.trim() && !uploadUrl.trim())}
                className="create-btn"
              >
                <Upload size={16} />
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotebookLMPanel;
