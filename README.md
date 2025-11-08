# Vibed Ed - AI-Powered Development Environment

> **DLX Studios Ultimate** - The future of vibe coding for 2025

An intelligent, AI-enhanced development environment built with Electron, React, and TypeScript. Features multi-file context awareness, intelligent code generation, autonomous AI agents, and a beautiful command center interface.

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron app
npm run electron:dev
```

### First-Time Setup

1. **Configure LLM** (Optional but recommended)
   - Open Settings → LLM
   - Choose Local (LM Studio/Ollama) or Cloud (Gemini/NotebookLM)
   - Enter API keys for cloud providers or configure local endpoints

2. **Create Your First Project**
   - Click "New Project" in the editor
   - Choose a template or start from scratch
   - Start coding with AI assistance!

3. **Try AI Features**
   - **VibeBar:** Type a task like "Add a login page" to generate plans
   - **AI Chat:** Chat with Ed (AI assistant) and convert ideas to projects
   - **Mission Control:** Deploy AI agents for automation

---

## 🎯 Core Features

### 🤖 AI Services (Renderer-Based Architecture)

**All AI services run efficiently in the renderer process - no IPC, no heavy dependencies, no blocking.**

#### Main Entry Point
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Index a project for AI understanding
await aiServiceBridge.startIndexing('/path/to/project');

// Generate execution plans
const { plan } = await aiServiceBridge.createPlan('Add dark mode');

// Structure raw ideas
const idea = await aiServiceBridge.structureIdea('Build a chat app');
```

#### Key AI Features
- **Multi-file Context Service** - Analyzes project structure and dependencies
- **Intelligent Code Generation** - Context-aware completions and refactoring
- **Refactoring Engine** - Safe, automated code transformations
- **LLM Router** - Smart routing between local and cloud LLM providers
- **Graceful Fallbacks** - Works offline with mock responses

### 🎭 AI Agents

- **Kai** - Creative brainstorming and idea generation
- **Guardian** - Proactive system health monitoring
- **ByteBot** - Task automation and workflow execution

### 🎨 Beautiful UI

- Command center aesthetic with glassmorphism
- Glowing interactive elements
- Desktop widget system
- Responsive monitor layout with drag-and-drop
- Smooth animations and transitions

### 🔧 Development Tools

- **VibeEditor** - Monaco-based code editor with AI assistance
- **FileExplorer** - Git-aware file browser with context menus
- **GitHub Integration** - Clone, commit, push, pull, branch management
- **Error Console** - Advanced error tracking and debugging
- **Notification Center** - Unified agent-to-user communication

---

## 📁 Project Structure

```
.
├── electron/              # Electron main process
│   └── main.ts           # Entry point, IPC handlers
├── src/                  # React renderer process
│   ├── components/       # UI components
│   │   ├── AppShell/    # Layout (LeftPanel, RightPanel)
│   │   ├── VibeEditor/  # Code editor
│   │   ├── AIChat/      # AI chat interface
│   │   └── [Workflow]/  # Workflow-specific components
│   ├── services/        # Business logic
│   │   ├── ai/          # ✅ AI services (renderer-side)
│   │   ├── agent/       # AI agents
│   │   ├── errors/      # Error tracking
│   │   └── project/     # Project management
│   ├── types/           # TypeScript type definitions
│   └── styles/          # Global CSS
├── docs/                # Documentation
└── release-new/         # Built application packages
```

---

## 🧠 AI Services Architecture

### Important: November 2025 Consolidation

All AI services have been consolidated into the **renderer process** for better performance:

**✅ Use (Renderer-Side):**
- `src/services/ai/aiServiceBridge.ts` - Main AI entry point
- `src/services/ai/router.ts` - LLM routing
- `src/services/ai/multiFileContextService.ts` - Project analysis
- `src/services/ai/projectKnowledgeService.ts` - Knowledge graph
- `src/services/ai/refactoringEngine.ts` - Code refactoring

**❌ Do Not Recreate (Deleted):**
- `electron/ai/*` - Heavy dependencies removed
- `electron/ipcHandlers.ts` - AI IPC removed

**Benefits:**
- 60% faster startup (2-3s vs 5-8s)
- 35% less memory usage
- Zero IPC overhead
- No chat lockups
- Works offline with fallbacks

📖 **Full details:** See [`AI_SERVICES_CONSOLIDATION.md`](./AI_SERVICES_CONSOLIDATION.md)

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start Vite dev server
npm run electron:dev     # Start Electron with hot reload
npm run build            # Build for production
npm run electron:build   # Build Electron app
npm run typecheck        # TypeScript type checking
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm test                 # Run Vitest tests
npm run test:e2e         # Run Playwright E2E tests
```

### Technology Stack

- **Frontend:** React 18, TypeScript 5
- **Desktop:** Electron 28
- **Build:** Vite 5, electron-builder
- **Editor:** Monaco Editor
- **State:** Zustand
- **Styling:** CSS3 (glassmorphism, animations)
- **AI:** LLM Router (LM Studio, Ollama, Gemini, NotebookLM)

### Code Standards

- **TypeScript:** Strict mode enabled
- **Temperature:** 0.91 for creative LLM tasks
- **Imports:** Use `@/` for `src/` imports
- **Components:** Functional with hooks, React.memo for pure components
- **Performance:** Lazy loading, code splitting, debouncing

---

## 🤖 For AI Assistants

If you're an AI assistant (like Cursor AI) working on this codebase:

1. **Read First:** [`.cursorrules`](./.cursorrules) - Critical architecture rules
2. **AI Services:** [`AI_SERVICES_CONSOLIDATION.md`](./AI_SERVICES_CONSOLIDATION.md) - Full AI architecture
3. **Quick Reference:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - Usage examples
4. **Guide:** [`AI_ASSISTANT_GUIDE.md`](./AI_ASSISTANT_GUIDE.md) - Detailed AI assistant guide

### Key Rules
- ✅ Use `aiServiceBridge` for all AI operations
- ❌ Never recreate `electron/ai/*` services (deleted for performance)
- ✅ Always provide LLM fallbacks for offline scenarios
- ✅ Use temperature 0.91 for creative tasks
- ✅ Clean up effects with return functions

---

## 📚 Documentation

### User Documentation
- [`QUICK_START.md`](./QUICK_START.md) - Getting started guide
- [`TESTING.md`](./TESTING.md) - Testing workflows

### Technical Documentation
- [`AI_SERVICES_CONSOLIDATION.md`](./AI_SERVICES_CONSOLIDATION.md) - AI architecture (critical)
- [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - AI service usage
- [`VERIFICATION_COMPLETE.md`](./VERIFICATION_COMPLETE.md) - Consolidation verification
- [`ARCHITECTURE_AI_SERVICES.md`](./ARCHITECTURE_AI_SERVICES.md) - Architecture diagrams

### Developer Documentation
- [`.cursorrules`](./.cursorrules) - Cursor AI rules
- [`AI_ASSISTANT_GUIDE.md`](./AI_ASSISTANT_GUIDE.md) - AI assistant guide

---

## 🎨 UI Themes & Styling

### Command Center Aesthetic
- Dark theme with glowing accents
- Glassmorphism effects (backdrop blur, transparency)
- Smooth transitions and hover effects
- Rounded corners and soft shadows

### CSS Variables
```css
--bg-primary: #0a0e1a
--accent-primary: #00d4ff
--accent-secondary: #7b2ff7
/* ... see src/styles/themes.css */
```

---

## 🐛 Troubleshooting

### "Chat locks up" / "Too many server scripts"
**Fixed in November 2025 consolidation.** Ensure you have the latest code with AI services in renderer process.

### "LLM generation failed"
- Check Settings → LLM configuration
- Verify local LLM server is running (LM Studio/Ollama)
- Check API keys for cloud providers
- Falls back to mock responses automatically

### "Project indexing failed"
- Verify project path is valid
- Check console for errors (`Ctrl+Shift+I`)
- Try re-opening the project

---

## 🚢 Building & Distribution

### Build for Production

```bash
# Build renderer and main process
npm run build

# Package for current platform
npm run electron:build

# Output: release-new/
```

### Auto-Updates

Configured via `electron-builder.json` to use GitHub Releases:

```json
{
  "publish": {
    "provider": "github",
    "owner": "Dunker007",
    "repo": "11-6"
  }
}
```

---

## 🤝 Contributing

### Before Contributing
1. Read [`.cursorrules`](./.cursorrules)
2. Review [`AI_SERVICES_CONSOLIDATION.md`](./AI_SERVICES_CONSOLIDATION.md)
3. Run `npm run typecheck` before committing

### Commit Message Format
```
feat: Add new feature
fix: Fix bug in component
refactor: Restructure services
docs: Update documentation
perf: Improve performance
```

---

## 📊 Performance Benchmarks

### After AI Services Consolidation (Nov 2025)
- **Startup Time:** 2-3 seconds
- **Memory Usage:** ~280MB total
- **IPC Overhead:** 0ms (no IPC for AI)
- **Chat Lockups:** None

### Before Consolidation
- **Startup Time:** 5-8 seconds
- **Memory Usage:** ~430MB total
- **IPC Overhead:** 50-100ms per AI operation
- **Chat Lockups:** Frequent

---

## 📞 Support

### For Users
- Check console for errors: `Ctrl+Shift+I`
- Review [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) for troubleshooting
- Verify LLM configuration in Settings → LLM

### For Developers
- Read [`AI_SERVICES_CONSOLIDATION.md`](./AI_SERVICES_CONSOLIDATION.md)
- Check [`.cursorrules`](./.cursorrules) for architecture rules
- Review [`AI_ASSISTANT_GUIDE.md`](./AI_ASSISTANT_GUIDE.md)

---

## 📜 License

Copyright © 2025 DLX Studios

---

## 🎉 Acknowledgments

Built with cutting-edge AI integration for the ultimate "vibe coding" experience in 2025.

**Special Features:**
- Intelligent, multi-file code generation
- Enhanced debugging and quality assurance
- Seamless, hybrid development environments
- Cognitive load reduction and flow state tools
- Improved team collaboration
- Security and trust-first design

---

**Version:** 1.0.0  
**Last Updated:** November 8, 2025  
**Status:** Production Ready ✅

