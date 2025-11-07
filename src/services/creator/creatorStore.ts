import { create } from 'zustand';
import { creatorService } from './creatorService';
import type { ContentDocument } from '@/types/creator';

interface CreatorStore {
  // State
  documents: ContentDocument[];
  templates: ReturnType<typeof creatorService.getTemplates>;
  currentDocument: ContentDocument | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadDocuments: () => void;
  loadTemplates: () => void;
  createDocument: (title: string, type?: ContentDocument['type'], templateId?: string) => ContentDocument;
  selectDocument: (id: string) => void;
  updateDocument: (id: string, updates: Partial<ContentDocument>) => ContentDocument | null;
  deleteDocument: (id: string) => boolean;
}

export const useCreatorStore = create<CreatorStore>((set, get) => ({
  documents: [],
  templates: [],
  currentDocument: null,
  isLoading: false,
  error: null,

  loadDocuments: () => {
    const docs = creatorService.getAllDocuments();
    set({ documents: docs });
  },

  loadTemplates: () => {
    const templates = creatorService.getTemplates();
    set({ templates });
  },

  createDocument: (title, type, templateId) => {
    const newDoc = creatorService.createDocument(title, type, templateId);
    get().loadDocuments();
    set({ currentDocument: newDoc });
    return newDoc;
  },

  selectDocument: (id) => {
    const doc = creatorService.getDocument(id);
    set({ currentDocument: doc });
  },

  updateDocument: (id, updates) => {
    const updated = creatorService.updateDocument(id, updates);
    if (updated) {
      get().loadDocuments();
      if (get().currentDocument?.id === id) {
        set({ currentDocument: updated });
      }
    }
    return updated;
  },

  deleteDocument: (id) => {
    const deleted = creatorService.deleteDocument(id);
    if (deleted) {
      get().loadDocuments();
      if (get().currentDocument?.id === id) {
        set({ currentDocument: null });
      }
    }
    return deleted;
  },
}));

