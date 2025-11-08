# Quick Reference - AI Services

## 🚀 Quick Start

All AI services now run in the renderer process. No IPC, no heavy dependencies, no blocking.

### Import and Use

```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Index a project
await aiServiceBridge.startIndexing('/project/path');

// Generate a plan
const { success, plan } = await aiServiceBridge.createPlan('Add dark mode');

// Structure an idea
const idea = await aiServiceBridge.structureIdea('Make a chat app');
```

## 📁 Service Locations

### AI Services (Renderer)
- `src/services/ai/aiServiceBridge.ts` - **Main entry point**
- `src/services/ai/router.ts` - LLM routing
- `src/services/ai/multiFileContextService.ts` - Project analysis
- `src/services/ai/projectKnowledgeService.ts` - Knowledge management
- `src/services/ai/refactoringEngine.ts` - Code refactoring
- `src/services/ai/providers/` - LLM provider implementations

### Types
- `src/types/plan.ts` - Plan, PlanStep, StructuredIdea

### Components Using AI
- `src/components/VibeBar/VibeBar.tsx` - Plan generation UI
- `src/components/AIChat/AIChat.tsx` - Chat with idea capture
- `src/App.tsx` - Project indexing orchestration

## 🔧 Configuration

### LLM Setup
1. Open Settings → LLM
2. Choose provider (Local or Cloud)
3. Configure API keys (for cloud) or endpoints (for local)

### Local LLMs
- **LM Studio:** Default port 1234
- **Ollama:** Default port 11434

### Cloud LLMs
- **Gemini:** Requires API key
- **NotebookLM:** Requires API key

## 🐛 Troubleshooting

### "LLM generation failed"
- Check Settings → LLM configuration
- Verify local LLM server is running
- Check API keys for cloud providers
- Falls back to mock plans automatically

### "Project indexing failed"
- Verify project path is valid
- Check console for specific errors
- Try re-opening the project

### Performance Issues
- Disable indexing if not needed
- Use local LLMs for faster response
- Clear old project data in Settings

## 📊 What Changed?

### ❌ Removed
- `electron/ai/` directory (all files)
- `electron/ipcHandlers.ts`
- IPC-based AI communication

### ✅ Enhanced
- `aiServiceBridge.ts` - Now self-contained
- Direct LLM integration via `llmRouter`
- Graceful fallbacks for all operations

### ⚠️ Important
- No breaking changes to public API
- All existing code continues to work
- Performance improved significantly

## 📖 Full Documentation

See `AI_SERVICES_CONSOLIDATION.md` for complete details.

