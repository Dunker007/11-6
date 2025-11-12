# Welcome to the Team - AI Assistant Onboarding

> **For AI Assistants Working on This Codebase**  
> Whether you're Composer, Chat, or any other AI assistant in Cursor - welcome! This guide will help you understand the project, our goals, and how to contribute effectively.

---

## 🎯 Project Vision

**DLX Studios Ultimate** is an AI-native development environment that combines:
- **Intelligent Code Editor** (Monaco-based with AI assistance)
- **Multi-LLM Support** (Local: Ollama/LM Studio, Cloud: Gemini/NotebookLM)
- **AI Agents** (Kai for creativity, Guardian for monitoring, ByteBot for automation)
- **WealthLab** (Financial portfolio management and analytics)
- **Command Center UI** (Holographic, glassmorphism aesthetic)

**Target Users:** Developers who want AI-powered coding assistance with privacy (local LLM support) and flexibility (cloud fallback).

**Long-term Goal:** Become the go-to AI-powered IDE that works seamlessly offline and online, with intelligent agents that proactively help developers.

---

## 🏗️ Current Architecture & State

### Renderer-Side AI Architecture (Critical!)

**November 2025 Consolidation:** All AI services moved to renderer process for performance.

**✅ Use (Renderer-Side):**
- `src/services/ai/aiServiceBridge.ts` - Main AI entry point
- `src/services/ai/router.ts` - LLM routing (local + cloud)
- `src/services/ai/multiFileContextService.ts` - Project analysis
- `src/services/ai/projectKnowledgeService.ts` - Knowledge management
- `src/services/ai/refactoringEngine.ts` - Code refactoring

**❌ Never Recreate (Deleted for Performance):**
- `electron/ai/*` - Heavy dependencies removed
- `electron/ipcHandlers.ts` - AI IPC removed

**Why?** IPC overhead caused chat lockups. Renderer-side = 60% faster startup, 35% less memory.

### Key Services

**State Management:** Zustand stores in `src/services/*/[name]Store.ts`
- `projectStore` - Active projects, files, content
- `llmStore` - LLM models, providers, generation
- `wealthStore` - Financial data, portfolios, watchlists
- `activityStore` - Activity feed logging

**Utilities:** Centralized in `src/utils/`
- `formatters.ts` - Currency, percentage, date, bytes formatting
- `llmConfig.ts` - Temperature mapping based on optimization priority
- `constants.ts` - Shared constants

**Types:** All in `src/types/`
- `plan.ts` - AI plan types
- `llm.ts` - LLM model types
- `optimizer.ts` - Optimization types
- `wealth.ts` - Financial types

---

## 📋 Current Priorities (January 2025)

### ✅ Recently Completed
1. **Formatter Consolidation** - Centralized all formatting utilities
2. **Temperature Optimization** - Dynamic temperature based on priority
3. **Function Call Handling** - Fixed streaming function calls for Gemini
4. **Model Catalog Update** - Added 12 models in 2-6GB range
5. **WealthLab Components** - Portfolio, Watchlist, News, Analytics dashboards

### 🔄 In Progress
1. **Code Documentation** - Adding AI-friendly comments and JSDoc
2. **Optimization Pass** - Removing redundancies, improving patterns

### 📝 Next Up
1. **Task-Based Model Routing** - Route tasks to specialized models (future enhancement)
2. **Enhanced Error Recovery** - Better error messages and fallbacks
3. **Performance Profiling** - Identify bottlenecks

---

## 🗺️ Roadmap

### Short-Term (Next 2 Weeks)
- Complete code documentation pass
- Finish optimization cleanup
- Add more inline comments explaining "why"
- Create architecture decision records

### Medium-Term (Next Month)
- Task-based model routing (use specialized models for different tasks)
- Enhanced file operations (recursive operations, better error handling)
- More WealthLab features (tax reporting, advanced analytics)
- Performance optimizations

### Long-Term (Next Quarter)
- Plugin system for extensibility
- Advanced AI features (inline suggestions, code review)
- Collaboration features
- Enhanced debugging tools

---

## 🤝 Team Philosophy & Approach

### Code Style
- **TypeScript:** Strict mode, always type everything
- **React:** Functional components with hooks, React.memo for pure components
- **Imports:** Use `@/` alias for `src/` imports
- **Formatting:** Centralized utilities, no duplicates
- **Temperature:** 0.91 for creative tasks (not 0.7)

### Performance Priorities
1. **Startup Time:** Target < 3 seconds
2. **Memory Usage:** Keep under 300MB
3. **No IPC for AI:** All AI in renderer process
4. **Lazy Loading:** Heavy components use React.lazy
5. **Code Splitting:** Vite manual chunks for optimization

### User Experience
- **Graceful Fallbacks:** Always work offline
- **Clear Error Messages:** Help users understand what went wrong
- **Consistent Formatting:** Financial data uses standard formats
- **Visual Feedback:** Loading states, progress indicators

### Testing Approach
- **Type Checking:** `npm run typecheck` must pass
- **Manual Testing:** Test critical paths before committing
- **Error Handling:** Test offline scenarios, API failures

---

## 🎓 Quick Start for AI Assistants

### Read First (In Order)
1. **`.cursorrules`** - Critical architecture rules
2. **`AI_SERVICES_CONSOLIDATION.md`** - Why AI services are in renderer
3. **`QUICK_REFERENCE.md`** - Usage examples
4. **`AI_ASSISTANT_GUIDE.md`** - Detailed technical guide

### Key Files to Understand
- `src/services/ai/aiServiceBridge.ts` - Main AI entry point
- `src/services/ai/router.ts` - LLM routing logic
- `src/utils/formatters.ts` - Centralized formatting
- `src/components/AIAssistant/AIAssistant.tsx` - Chat interface

### Common Patterns

**Using AI Services:**
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
await aiServiceBridge.createPlan('Add login page');
```

**Using Formatters:**
```typescript
import { formatCurrency, formatPercent } from '@/utils/formatters';
formatCurrency(amount, { minimumFractionDigits: 0 });
formatPercent(value, 2, false, true); // decimals, isPercent, showSign
```

**Using Stores:**
```typescript
import { useProjectStore } from '@/services/project/projectStore';
const { activeProject, setActiveFile } = useProjectStore();
```

---

## 🚧 Areas Needing Attention

### Technical Debt
- Some components lack JSDoc documentation
- Complex logic needs inline comments explaining "why"
- Type definitions could use more descriptive comments

### Optimization Opportunities
- Consolidate duplicate error handling patterns
- Refactor redundant store/service patterns
- Remove unused code and dead imports

### Feature Gaps
- Task-based model routing (use specialized models)
- Enhanced file operations error recovery
- More comprehensive testing

### Documentation Needs
- Architecture decision records
- Component usage examples
- Service method documentation

---

## 💡 Contribution Guidelines

### Before Making Changes
1. Read relevant documentation (`.cursorrules`, `AI_SERVICES_CONSOLIDATION.md`)
2. Understand the architecture (renderer-side AI)
3. Check existing patterns before creating new ones

### When Adding Features
1. Use centralized utilities (`formatters.ts`, `llmConfig.ts`)
2. Follow existing patterns (stores, services, components)
3. Add JSDoc comments for new functions/components
4. Test offline scenarios (graceful fallbacks)

### When Fixing Bugs
1. Understand root cause, not just symptoms
2. Check if similar issues exist elsewhere
3. Add inline comments explaining the fix
4. Update relevant documentation

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] Uses centralized utilities (no duplicates)
- [ ] Has graceful fallbacks for offline/errors
- [ ] Follows existing patterns
- [ ] Has appropriate comments/JSDoc
- [ ] `npm run typecheck` passes

---

## 🎯 Current Assignments

### High Priority
1. **Complete Code Documentation Pass**
   - Add JSDoc to all components
   - Add file-level context comments
   - Document complex algorithms

2. **Finish Optimization Cleanup**
   - Remove duplicate patterns
   - Consolidate error handling
   - Clean up unused code

### Medium Priority
3. **Add Architecture Decision Records**
   - Document major decisions
   - Explain "why" not just "what"
   - Include alternatives considered

4. **Enhance Error Messages**
   - More descriptive errors
   - Actionable suggestions
   - Better recovery paths

---

## 📚 Learning Resources

### Architecture
- `AI_SERVICES_CONSOLIDATION.md` - Why renderer-side AI
- `ARCHITECTURE_AI_SERVICES.md` - Architecture diagrams
- `QUICK_REFERENCE.md` - Usage examples

### Development
- `QUICK_START.md` - Getting started guide
- `TESTING.md` - Testing workflows
- `.cursorrules` - Architecture rules

### Examples
- `src/components/AIAssistant/AIAssistant.tsx` - Chat with Gemini tools
- `src/components/LLMOptimizer/WealthLab/components/AnalyticsDashboard.tsx` - Complex component
- `src/services/ai/aiServiceBridge.ts` - Service pattern

---

## 🚀 Getting Started

1. **Read the Architecture:**
   - Start with `.cursorrules`
   - Then `AI_SERVICES_CONSOLIDATION.md`
   - Understand renderer-side AI architecture

2. **Understand the Codebase:**
   - Explore `src/services/ai/` - AI services
   - Check `src/components/` - UI components
   - Review `src/utils/` - Shared utilities

3. **Start Contributing:**
   - Pick a task from "Current Assignments"
   - Follow existing patterns
   - Add documentation as you go

---

## 🤔 Questions?

If you're unsure about something:
1. Check `.cursorrules` for architecture rules
2. Look at similar existing code for patterns
3. Read relevant documentation files
4. When in doubt, ask (via comments or documentation)

---

**Welcome to the team! Let's build something amazing together.** 🚀

---

*Last Updated: January 2025*  
*Version: 1.0.1*

