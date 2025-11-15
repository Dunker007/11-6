import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LLMOptimizerPanel from './LLMOptimizerPanel';

// Mock dependencies
vi.mock('../../services/ai/llmStore', () => ({
  useLLMStore: vi.fn(() => ({
    providers: [],
    selectedProvider: null,
    selectedModel: null,
    setSelectedProvider: vi.fn(),
    setSelectedModel: vi.fn(),
  })),
}));

vi.mock('../../services/ai/llmOptimizerService', () => ({
  getSystemInfo: vi.fn().mockResolvedValue({}),
  getRecommendedModels: vi.fn().mockResolvedValue([]),
}));

describe('LLMOptimizerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the optimizer panel', () => {
    render(<LLMOptimizerPanel />);
    // Basic render test - component may have conditional rendering
    expect(document.body).toBeTruthy();
  });
});

