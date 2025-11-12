import { create } from 'zustand';
import { codeReviewService } from './codeReviewService';
import type { CodeReview, ReviewSettings } from '@/types/codereview';
import { withAsyncOperation } from '@/utils/storeHelpers';

interface CodeReviewStore {
  // State
  reviews: CodeReview[];
  currentReview: CodeReview | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadReviews: () => void;
  analyzeCode: (projectPath: string, settings: ReviewSettings) => Promise<CodeReview>;
  selectReview: (id: string) => void;
  deleteReview: (id: string) => boolean;
}

export const useCodeReviewStore = create<CodeReviewStore>((set, get) => ({
  reviews: [],
  currentReview: null,
  isLoading: false,
  error: null,

  loadReviews: () => {
    const reviews = codeReviewService.getAllReviews();
    set({ reviews });
  },

  analyzeCode: async (projectPath, settings) => {
    const result = await withAsyncOperation(
      async () => {
        const review = await codeReviewService.analyzeCode(projectPath, settings);
        get().loadReviews();
        set({ currentReview: review });
        return review;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'codeReviewStore'
    );
    if (!result) {
      throw new Error('Failed to analyze code');
    }
    return result;
  },

  selectReview: (id) => {
    const review = codeReviewService.getReview(id);
    set({ currentReview: review });
  },

  deleteReview: (id) => {
    const deleted = codeReviewService.deleteReview(id);
    if (deleted) {
      get().loadReviews();
      if (get().currentReview?.id === id) {
        set({ currentReview: null });
      }
    }
    return deleted;
  },
}));

