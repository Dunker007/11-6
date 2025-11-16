<!-- e4e272e5-89e5-4d8e-a015-748c09f5e231 0add0281-48f0-41ed-9622-0db968dcd65d -->
# Vibed Ed 2.0 - Complete Upgrade Implementation Plan

## Overview

Complete transformation of Vibed Ed into a cutting-edge AI-powered IDE implementing all 15 major upgrade features. The implementation is organized into 4 phases, starting with high-impact quick wins and progressing to ecosystem-building features.

## Phase 1: Core Multi-File & Editing Enhancements (Quick Wins)

### 1.1 Multi-File Editing with Split Views

**Files to modify/create:**

- `src/components/VibeEditor/VibeEditor.tsx` - Add tab management and split view logic
- `src/components/VibeEditor/TabBar.tsx` - NEW: Tab management component
- `src/components/VibeEditor/SplitView.tsx` - NEW: Split view container component
- `src/components/VibeEditor/EditorPane.tsx` - NEW: Individual editor pane wrapper
- `src/services/editor/tabStore.ts` - NEW: Zustand store for tab state
- `src/types/editor.ts` - NEW: Editor tab and split view types

**Implementation details:**

- Add tab management state (open tabs, active tab, tab groups)
- Implement horizontal/vertical split views with resize handles
- Support up to 4 panes simultaneously
- Each pane can have multiple tabs with Ctrl+Tab switching
- Quick file switcher (Ctrl+P) with fuzzy search
- Tab context menu (close, close others, close all)
- Visual indicators for unsaved tabs

### 1.2 Advanced Turbo Edit Modes

**Files to modify/create:**

- `src/components/VibeEditor/TurboEdit.tsx` - Extend with new modes
- `src/components/VibeEditor/TurboEditModeSelector.tsx` - NEW: Mode selector UI
- `src/components/VibeEditor/MultiFileTurboEdit.tsx` - NEW: Multi-file editing
- `src/services/ai/multiFileTurboEditService.ts` - NEW: Multi-file editing logic
- `src/services/ai/refactoringService.ts` - NEW: Rename refactoring with preview

**Implementation details:**

- Add mode selector: Single File, Multi-File, Refactor, Generate, Test, Document
- Multi-file Turbo Edit: Analyze patterns across project, apply changes to all matches
- Refactor mode: Rename symbol with preview showing all occurrences
- Generate mode: Create entire features from prompts (files, functions, tests)
- Test mode: Generate comprehensive test suites for selected code
- Document mode: Auto-generate JSDoc/TSDoc comments

### 1.3 Built-in Terminal Integration

**Files to modify/create:**

- `src/components/VibeEditor/TerminalPanel.tsx` - NEW: Terminal component
- `src/services/terminal/terminalService.ts` - NEW: Terminal execution service
- `src/services/terminal/terminalStore.ts` - NEW: Terminal state management
- `src/services/ai/terminalAI.ts` - NEW: Ed's terminal command execution
- `src/core/webcontainer/webcontainerService.ts` - NEW: WebContainer integration (if browser mode)

**Implementation details:**

- Integrated terminal panel at bottom (toggleable with Ctrl+` )
- Multiple terminal tabs (split terminals)
- Ed can execute commands: "Run tests" → executes `npm test`
- Parse terminal output for errors, show in editor
- WebContainer integration for browser-based Node.js environment
- Docker integration (if system supports it)
- Command history and autocomplete

## Phase 2: Visual & AI Context Features

### 2.1 Visual Code Flow & AI Insights Overlay

**Files to modify/create:**

- `src/components/VibeEditor/CodeFlowOverlay.tsx` - NEW: Visual code flow component
- `src/components/VibeEditor/AIInsightsPanel.tsx` - NEW: AI insights sidebar
- `src/services/ai/codeFlowService.ts` - NEW: Dependency graph generation
- `src/services/ai/insightsOverlayService.ts` - NEW: Real-time insights overlay
- `src/services/ai/performanceHotspotService.ts` - NEW: Performance analysis
- `src/components/VibeEditor/CodeQualityHeatmap.tsx` - NEW: Visual quality indicators

**Implementation details:**

- Interactive dependency graph showing function/file relationships
- Hover explanations for complex code sections
- Visual diff timeline showing change history
- Performance hotspots highlighted (slow functions, memory usage)
- Real-time code quality heatmap (complexity, test coverage, maintainability)
- Click-to-navigate between related files/functions

### 2.2 AI Context Panels

**Files to modify/create:**

- `src/components/VibeEditor/AIContextPanels.tsx` - NEW: Context panels container
- `src/components/VibeEditor/CodebaseInsightsPanel.tsx` - NEW: Project insights
- `src/components/VibeEditor/FunctionCallGraph.tsx` - NEW: Call graph visualization
- `src/components/VibeEditor/TestCoverageOverlay.tsx` - NEW: Test coverage UI
- `src/components/VibeEditor/DependencyAnalyzer.tsx` - NEW: Dependency analysis
- `src/services/ai/codebaseInsightsService.ts` - NEW: Insights generation

**Implementation details:**

- Codebase Insights panel: Ed explains project structure, patterns, architecture
- Function call graph: Visualize relationships between functions
- Test coverage overlay: Show which code is covered, Ed suggests missing tests
- Dependency analyzer: Find unused imports, circular dependencies, suggest fixes
- Refactoring opportunities: Highlight complex code, suggest improvements
- Context-aware suggestions based on entire codebase

### 2.3 Live Preview & Instant Feedback

**Files to modify/create:**

- `src/components/VibeEditor/LivePreviewPanel.tsx` - NEW: Live preview component
- `src/components/VibeEditor/ComponentExplorer.tsx` - NEW: Component tree visualization
- `src/services/preview/livePreviewService.ts` - NEW: Preview synchronization
- `src/services/preview/hotReloadService.ts` - NEW: Hot reload logic
- `src/components/VibeEditor/StyleInspector.tsx` - NEW: CSS inspector

**Implementation details:**

- Live preview pane (React/Vue/etc.) updating in real-time as you code
- Visual debugger: Highlight DOM elements when you edit related code
- Instant error detection with AI suggestions
- Component explorer: Visualize component tree, click to jump to code
- Style inspector: Edit CSS and see changes immediately
- Support for React, Vue, HTML previews

## Phase 3: Collaboration & Advanced Features

### 3.1 Real-Time Collaborative Editing

**Files to modify/create:**

- `src/services/collaboration/collaborationService.ts` - NEW: Collaboration backend
- `src/services/collaboration/presenceService.ts` - NEW: User presence tracking
- `src/components/VibeEditor/CollaborationPanel.tsx` - NEW: Collaboration UI
- `src/components/VibeEditor/LiveCursors.tsx` - NEW: Live cursor rendering
- `src/components/VibeEditor/ConflictResolver.tsx` - NEW: Conflict resolution UI
- `src/services/websocket/websocketService.ts` - NEW: WebSocket for real-time sync

**Implementation details:**

- Live cursors showing where collaborators are editing
- Presence indicators (who's viewing/editing which files)
- Share link generation for collaborative sessions
- Comment threads anchored to specific code lines
- Conflict resolution UI with 3-way merge
- Operational transformation for real-time sync

### 3.2 Voice-Powered Coding with Ed

**Files to modify/create:**

- `src/services/voice/voiceService.ts` - NEW: Speech recognition/synthesis
- `src/services/voice/voiceCommandService.ts` - NEW: Command parsing
- `src/components/VibeEditor/VoiceControlPanel.tsx` - NEW: Voice UI
- `src/services/ai/voiceToCodeService.ts` - NEW: Voice-to-code conversion
- `src/services/ai/voiceNavigationService.ts` - NEW: Voice navigation

**Implementation details:**

- Voice commands: "Add error handling here", "Refactor this function"
- Voice-to-code: Describe features, Ed generates code
- Natural language navigation: "Show me where we use the API client"
- Voice chat with Ed (speech-to-text/text-to-speech)
- Hands-free coding mode for accessibility
- Custom voice command mappings

### 3.3 Git-Native Workflow Integration

**Files to modify/create:**

- `src/components/VibeEditor/GitBlameOverlay.tsx` - NEW: Git blame inline display
- `src/components/VibeEditor/GitBranchGraph.tsx` - NEW: Visual branch graph
- `src/components/VibeEditor/GitCommitAssistant.tsx` - NEW: Ed's commit helper
- `src/services/git/gitBlameService.ts` - NEW: Git blame integration
- `src/services/git/gitConflictService.ts` - NEW: Conflict resolution
- `src/services/ai/gitCommitService.ts` - NEW: AI commit message generation

**Implementation details:**

- Inline Git blame showing author/date with Ed's summary
- Visual branch graph in editor sidebar
- Ed-assisted commit messages (analyze changes, suggest message)
- Conflict resolution with Ed suggestions
- PR creation workflow guided by Ed
- Git status indicators in file explorer

### 3.4 Time-Travel Debugging

**Files to modify/create:**

- `src/components/VibeEditor/TimeTravelPanel.tsx` - NEW: Timeline UI
- `src/services/history/codeHistoryService.ts` - NEW: Code change tracking
- `src/services/history/snapshotService.ts` - NEW: State snapshots
- `src/services/ai/historyAnalysisService.ts` - NEW: Ed analyzes history
- `src/components/VibeEditor/ChangeTimeline.tsx` - NEW: Visual timeline

**Implementation details:**

- Code history timeline: Step through changes
- Ed explains why changes were made
- Revert suggestions: Ed recommends when to undo
- Visual diff timeline: See code evolution
- Snapshot management: Save states, jump between them
- Blame with context: See who changed what and why

## Phase 4: Ecosystem & Polish

### 4.1 Project Templates & AI Scaffolding

**Files to modify/create:**

- `src/components/VibeEditor/TemplateSelector.tsx` - NEW: Template chooser
- `src/services/templates/templateService.ts` - NEW: Template management
- `src/services/templates/templateStore.ts` - NEW: Template state
- `src/services/ai/scaffoldingService.ts` - NEW: AI project scaffolding
- `src/components/marketplace/TemplateMarketplace.tsx` - NEW: Community templates

**Implementation details:**

- One-click project templates (React, Next.js, Vue, etc.)
- Ed-guided setup: Prompts for project structure
- Smart scaffolding: Generate folders/files with Ed's suggestions
- Template marketplace: Browse and install community templates
- Custom template builder with Ed's help
- Template versioning and updates

### 4.2 Visual AI Assistant Canvas

**Files to modify/create:**

- `src/components/VibeEditor/WhiteboardCanvas.tsx` - NEW: Drawing canvas
- `src/services/canvas/diagramService.ts` - NEW: Diagram generation
- `src/services/ai/diagramGeneratorService.ts` - NEW: AI diagram creation
- `src/components/VibeEditor/ArchitectureDrawer.tsx` - NEW: Architecture tool

**Implementation details:**

- Whiteboard mode: Ed helps draw architectures
- Flowchart generator from code
- Entity relationship diagrams from database code
- API visualization from endpoints
- Interactive diagramming with Ed's input
- Export diagrams as images/SVG

### 4.3 Smart Code Snippets & AI Completions 2.0

**Files to modify/create:**

- `src/services/snippets/snippetStore.ts` - NEW: Snippet management
- `src/services/snippets/snippetMarketplace.ts` - NEW: Community snippets
- `src/services/ai/learningSnippetService.ts` - NEW: Learn from patterns
- `src/services/ai/completionConfidenceService.ts` - NEW: Confidence scoring
- `src/components/VibeEditor/SnippetBuilder.tsx` - NEW: Snippet creator

**Implementation details:**

- Project-aware snippets: Ed learns your patterns
- Custom snippet builder with Ed's help
- Snippet marketplace: Browse and install community snippets
- AI completions with confidence scores
- Multi-line completions for entire functions
- Context-aware snippet suggestions

### 4.4 Personalized Coding Dashboard

**Files to modify/create:**

- `src/components/VibeEditor/PersonalDashboard.tsx` - NEW: Dashboard UI
- `src/services/analytics/codingAnalyticsService.ts` - NEW: Analytics collection
- `src/services/analytics/productivityService.ts` - NEW: Productivity tracking
- `src/services/ai/dashboardInsightsService.ts` - NEW: Ed's insights generation
- `src/components/VibeEditor/AchievementSystem.tsx` - NEW: Achievements UI

**Implementation details:**

- Analytics: Coding time, most-edited files, productivity trends
- Ed's insights: Patterns, improvement suggestions
- Goal tracking: "Ed, help me refactor 5 functions today"
- Achievement system: Unlock badges with Ed
- Daily summaries: Ed recaps your work
- Productivity visualizations

### 4.5 Extension Ecosystem & Plugin API

**Files to modify/create:**

- `src/services/extensions/extensionApi.ts` - NEW: Extension API
- `src/services/extensions/extensionLoader.ts` - NEW: Extension loading
- `src/components/Settings/ExtensionManager.tsx` - NEW: Extension management UI
- `src/services/extensions/extensionMarketplace.ts` - NEW: Marketplace integration
- `src/services/extensions/pluginBuilder.ts` - NEW: Plugin development tools

**Implementation details:**

- Plugin system: Community extensions
- Ed-powered plugins: AI-enhanced extensions
- Marketplace: Browse and install extensions
- Custom plugin builder: Create plugins with Ed
- API for third-party integrations
- Extension sandboxing for security

## Architecture Changes

### New Service Layer Structure

```
src/services/
├── editor/          # Tab, split view, editor state
├── terminal/        # Terminal execution
├── voice/           # Voice commands and TTS/STT
├── collaboration/   # Real-time collaboration
├── preview/         # Live preview and hot reload
├── history/         # Code history and time-travel
├── templates/       # Project templates
├── snippets/        # Code snippets
├── extensions/      # Plugin system
├── canvas/          # Visual diagramming
├── analytics/       # Coding analytics
└── git/             # Enhanced Git integration
```

### New Component Structure

```
src/components/VibeEditor/
├── TabBar.tsx
├── SplitView.tsx
├── EditorPane.tsx
├── TerminalPanel.tsx
├── LivePreviewPanel.tsx
├── CodeFlowOverlay.tsx
├── AIContextPanels.tsx
├── CollaborationPanel.tsx
├── VoiceControlPanel.tsx
├── GitBlameOverlay.tsx
├── TimeTravelPanel.tsx
├── TemplateSelector.tsx
├── WhiteboardCanvas.tsx
├── PersonalDashboard.tsx
└── [existing files...]
```

## State Management Updates

### New Zustand Stores

- `tabStore.ts` - Tab management (open tabs, active tab, tab groups)
- `terminalStore.ts` - Terminal state (sessions, history)
- `collaborationStore.ts` - Collaboration state (users, cursors, comments)
- `voiceStore.ts` - Voice state (listening, commands)
- `templateStore.ts` - Template state (selected, installed)
- `snippetStore.ts` - Snippet state (user, marketplace)
- `extensionStore.ts` - Extension state (installed, active)
- `analyticsStore.ts` - Analytics state (metrics, goals)

## Key Technical Decisions

1. **Monaco Editor Integration**: Use Monaco's built-in diff editor, multi-cursor, and decorations for advanced features
2. **WebSocket for Collaboration**: Use WebSocket for real-time collaboration (with fallback to polling)
3. **WebContainer for Terminal**: Use @webcontainer/api for browser-based terminal when available
4. **Yjs for Collaboration**: Consider Yjs for operational transformation (optional)
5. **Voice Recognition**: Use Web Speech API for voice commands
6. **Graph Rendering**: Use D3.js or vis.js for code flow visualization
7. **Extension System**: Use a plugin architecture similar to VS Code's extension API

## Dependencies to Add

```json
{
  "@webcontainer/api": "^1.6.1",  // Already installed
  "yjs": "^13.6.0",               // For collaboration
  "y-monaco": "^0.4.1",           // Monaco + Yjs integration
  "d3": "^7.8.0",                 // For graph visualization
  "vis-network": "^9.1.9",        // Alternative graph library
  "xterm": "^5.3.0",              // Terminal emulator
  "xterm-addon-fit": "^0.8.0",    // Terminal fit addon
  "fuse.js": "^7.0.0"             // Fuzzy search for file switcher
}
```

## Migration Strategy

1. **Incremental rollout**: Implement Phase 1 first, test thoroughly, then move to Phase 2
2. **Feature flags**: Use feature flags to enable/disable new features during development
3. **Backward compatibility**: Ensure existing VibeEditor functionality continues to work
4. **Performance monitoring**: Monitor bundle size and runtime performance as features are added
5. **User feedback**: Gather feedback after each phase before proceeding

## Testing Strategy

- Unit tests for all new services
- Integration tests for multi-file editing, collaboration, terminal
- E2E tests for critical workflows (editing, saving, collaboration)
- Performance tests for large files, many tabs, collaboration load
- Accessibility tests for voice features and keyboard navigation

## Documentation Updates

- Update `README.md` with new features
- Create `VIBED_ED_2.0_GUIDE.md` with feature documentation
- Update `QUICK_START.md` with new workflows
- Add inline documentation for all new components/services
- Create video tutorials for voice commands, collaboration, visual features

## Success Metrics

- Multi-file editing: Support 10+ open tabs without performance degradation
- Collaboration: Real-time sync with <100ms latency
- Voice commands: 95%+ accuracy in command recognition
- Terminal: Full Node.js environment support
- Templates: 20+ community templates available
- Extensions: 10+ community extensions within 3 months

### To-dos

- [ ] Implement multi-file tab management with TabBar component and tabStore
- [ ] Create SplitView component supporting horizontal/vertical splits with resize handles
- [ ] Implement Ctrl+P quick file switcher with fuzzy search
- [ ] Extend TurboEdit with multi-file, refactor, generate, test, and document modes
- [ ] Integrate terminal panel with xterm.js and command execution service
- [ ] Build visual code flow overlay with dependency graph visualization
- [ ] Create AI context panels (insights, call graph, test coverage, dependencies)
- [ ] Implement live preview panel with hot reload for React/Vue/HTML
- [ ] Build real-time collaboration with live cursors, presence, and conflict resolution
- [ ] Implement voice-powered coding with speech recognition and Ed integration
- [ ] Add Git-native features: inline blame, branch graph, AI commit messages
- [ ] Create time-travel debugging with code history timeline and snapshots
- [ ] Build project template system with marketplace and AI scaffolding
- [ ] Implement visual AI assistant canvas with diagram generation
- [ ] Create smart snippet system with learning and marketplace integration
- [ ] Build personalized coding dashboard with analytics and Ed insights
- [ ] Develop extension ecosystem with plugin API and marketplace