import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VibeEditor from './VibeEditor';

// Mock dependencies
vi.mock('../../services/project/projectStore', () => ({
  useProjectStore: vi.fn(() => ({
    activeProject: null,
    projects: [],
    loadProjects: vi.fn(),
    createProject: vi.fn(),
    setActiveProject: vi.fn(),
    updateFile: vi.fn(),
    getFileContent: vi.fn().mockReturnValue(''),
    setActiveFile: vi.fn(),
  })),
}));

vi.mock('../../services/activity/activityStore', () => ({
  useActivityStore: vi.fn(() => ({
    addActivity: vi.fn(),
  })),
}));

vi.mock('../../services/errors/errorContext', () => ({
  errorContext: {
    setProject: vi.fn(),
    setFile: vi.fn(),
  },
}));

vi.mock('@/components/ui', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('@/services/agents/vibesStore', () => ({
  useVibesStore: vi.fn(() => ({
    vibes: [],
  })),
}));

vi.mock('@/services/agents/proactiveAgentService', () => ({
  proactiveAgentService: {
    analyzeCode: vi.fn(),
  },
}));

vi.mock('@/services/ai/semanticIndexService', () => ({
  semanticIndexService: {
    startIndexingForCurrentProject: vi.fn(),
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange }: { onChange?: (value: string | undefined) => void }) => {
    return (
      <div data-testid="monaco-editor" onClick={() => onChange?.('test content')}>
        Monaco Editor
      </div>
    );
  },
}));

vi.mock('./FileExplorer', () => ({
  default: () => <div data-testid="file-explorer">File Explorer</div>,
}));

vi.mock('./TurboEdit', () => ({
  default: () => <div data-testid="turbo-edit">Turbo Edit</div>,
}));

vi.mock('../AIAssistant/AIAssistant', () => ({
  default: () => <div data-testid="ai-assistant">AI Assistant</div>,
}));

vi.mock('../ProjectSearch/ProjectSearch', () => ({
  default: () => <div data-testid="project-search">Project Search</div>,
}));

describe('VibeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the editor component', () => {
    render(<VibeEditor />);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should render file explorer', () => {
    render(<VibeEditor />);
    expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
  });

  it('should load projects on mount', async () => {
    const { useProjectStore } = await import('../../services/project/projectStore');
    const mockLoadProjects = vi.fn();
    vi.mocked(useProjectStore).mockReturnValue({
      activeProject: null,
      projects: [],
      loadProjects: mockLoadProjects,
      createProject: vi.fn(),
      setActiveProject: vi.fn(),
      updateFile: vi.fn(),
      getFileContent: vi.fn().mockReturnValue(''),
      setActiveFile: vi.fn(),
    } as any);

    render(<VibeEditor />);
    
    await waitFor(() => {
      expect(mockLoadProjects).toHaveBeenCalled();
    });
  });
});

