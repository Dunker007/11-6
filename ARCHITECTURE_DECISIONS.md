# Architecture Decision Records

This document records major architectural decisions and their rationale.

---

## ADR-001: Renderer-Side AI Services

**Date:** November 2025  
**Status:** ✅ Implemented  
**Decision:** Move all AI services from Electron main process to renderer process

### Context
Application was experiencing:
- Chat interface lockups
- Slow startup times (5-8 seconds)
- "Too many server scripts" failures
- Heavy synchronous dependencies blocking main thread

### Decision
Consolidated all AI services into renderer process, eliminating IPC overhead.

### Consequences

**Positive:**
- 60% faster startup (2-3 seconds)
- 35% less memory usage (~280MB vs ~430MB)
- Zero IPC overhead for AI operations
- No chat lockups
- Works offline with graceful fallbacks

**Negative:**
- Cannot use Node.js-only modules in AI services
- Must use browser-compatible APIs

### Alternatives Considered
1. **Keep in main process** - Rejected due to performance issues
2. **Hybrid approach** - Rejected for complexity
3. **Renderer-side** - ✅ Chosen for simplicity and performance

### Files Affected
- Deleted: `electron/ai/*`
- Created: `src/services/ai/aiServiceBridge.ts` (enhanced)
- Updated: All components using AI services

### References
- See `AI_SERVICES_CONSOLIDATION.md` for full details

---

## ADR-002: Centralized Formatting Utilities

**Date:** January 2025  
**Status:** ✅ Implemented  
**Decision:** Consolidate all formatting functions into `src/utils/formatters.ts`

### Context
Duplicate formatting functions across components:
- `formatCurrency` in multiple files
- `formatPercent` with different implementations
- `formatBytes` duplicated
- `formatDate` with inconsistent styles

### Decision
Create single source of truth in `src/utils/formatters.ts` with:
- Consistent API
- Configurable options
- JSDoc documentation
- Type safety

### Consequences

**Positive:**
- Single source of truth
- Consistent formatting across app
- Easier to maintain and update
- Better type safety

**Negative:**
- Requires updating all components (one-time cost)
- Must pass options for edge cases

### Implementation
- Created `src/utils/formatters.ts` with all formatters
- Updated 15+ components to use centralized utilities
- Enhanced formatters to support all use cases

### Files Affected
- Created: `src/utils/formatters.ts`
- Updated: All components using formatters (15+ files)

---

## ADR-003: Dynamic Temperature Based on Optimization Priority

**Date:** January 2025  
**Status:** ✅ Implemented  
**Decision:** Use optimization priority to determine LLM temperature

### Context
Temperature was hardcoded to 0.91 in AIAssistant, overriding user preferences from LLMOptimizerPanel.

### Decision
Create `src/utils/llmConfig.ts` with `getTemperatureForPriority()`:
- `quality` → 0.7 (more deterministic)
- `speed` → 0.7 (faster, less creative)
- `balanced` → 0.91 (creative but consistent)

### Consequences

**Positive:**
- Respects user preferences
- Consistent across all providers
- Easy to adjust temperature mapping

**Negative:**
- None

### Implementation
- Created `src/utils/llmConfig.ts`
- Updated AIAssistant to use dynamic temperature
- Applies to all providers (not just Gemini)

### Files Affected
- Created: `src/utils/llmConfig.ts`
- Updated: `src/components/AIAssistant/AIAssistant.tsx`

---

## ADR-004: StreamChunk Type Enhancement for Function Calls

**Date:** January 2025  
**Status:** ✅ Implemented  
**Decision:** Add `functionCalls` property to StreamChunk type

### Context
Gemini streaming responses can include function calls, but they were being concatenated as plain text instead of parsed.

### Decision
Enhance `StreamChunk` interface to include optional `functionCalls` array.

### Consequences

**Positive:**
- Properly handles function calls in streaming
- Can display function calls in UI
- Works with Gemini tools/function calling

**Negative:**
- Requires updating all streaming consumers
- More complex type handling

### Implementation
- Updated `src/types/llm.ts` StreamChunk interface
- Enhanced `cloudLLM.ts` to extract function calls
- Updated `AIAssistant.tsx` to handle function calls
- Updated `llmStore.ts` to yield full chunks

### Files Affected
- Updated: `src/types/llm.ts`
- Updated: `src/services/ai/providers/cloudLLM.ts`
- Updated: `src/components/AIAssistant/AIAssistant.tsx`
- Updated: `src/services/ai/llmStore.ts`

---

## ADR-005: Zustand Store Organization

**Date:** Ongoing  
**Status:** ✅ Established Pattern  
**Decision:** Organize stores by domain in `src/services/[domain]/[name]Store.ts`

### Context
Stores were scattered across `src/core/` and `src/services/`.

### Decision
Consolidate all stores to `src/services/` organized by domain:
- `src/services/project/projectStore.ts`
- `src/services/ai/llmStore.ts`
- `src/services/wealth/wealthStore.ts`

### Consequences

**Positive:**
- Clear organization
- Easy to find stores
- Co-located with related services

**Negative:**
- Requires updating imports (one-time cost)

### Implementation
- Migrated stores from `src/core/` to `src/services/`
- Updated all imports across codebase
- Established pattern for new stores

### Files Affected
- Migrated: All stores from `src/core/` to `src/services/`
- Updated: All files importing stores

---

## ADR-006: Electron Production Loading Strategy

**Date:** January 2025  
**Status:** ✅ Implemented  
**Decision:** Use `loadFile()` instead of `loadURL()` for packaged apps

### Context
Packaged Electron app was hanging on blue screen. Issue was related to `.asar` archive path resolution.

### Decision
Switch from `win.loadURL(fileUrl)` to `win.loadFile(indexPath)` for production builds.

### Consequences

**Positive:**
- `loadFile()` has built-in `.asar` support
- More reliable path resolution
- Simpler implementation

**Negative:**
- None

### Implementation
- Updated `electron/main.ts` to use `loadFile()` in production
- Added extensive debug logging
- Enhanced error handling

### Files Affected
- Updated: `electron/main.ts`

---

## ADR-007: Preload Script Safety

**Date:** January 2025  
**Status:** ✅ Implemented  
**Decision:** Implement `safeExpose` helper to prevent property conflicts

### Context
Preload script was overwriting existing `window` properties (e.g., `window.screen`), causing renderer crashes.

### Decision
Create `safeExpose` helper that checks if property exists before exposing.

### Consequences

**Positive:**
- Prevents property conflicts
- More robust preload script
- Better error handling

**Negative:**
- Slightly more complex preload script

### Implementation
- Created `safeExpose` helper in `electron/preload.ts`
- Updated all `contextBridge.exposeInMainWorld` calls to use `safeExpose`

### Files Affected
- Updated: `electron/preload.ts`

---

## ADR-008: Centralized Store Error Handling

**Date:** January 2025  
**Status:** ✅ Implemented  
**Decision:** Create `storeHelpers` utility for consistent error handling across all Zustand stores

### Context
All Zustand stores had duplicate error handling patterns:
- Repeated `set({ isLoading: true, error: null })` / `set({ isLoading: false })`
- Inconsistent error message extraction
- No centralized error logging
- ~200+ lines of duplicate try-catch blocks

### Decision
Create `src/utils/storeHelpers.ts` with:
- `extractErrorMessage()` - Unified error message extraction
- `withAsyncOperation()` - Async wrapper with loading/error state management
- `withLoadingState()` - Loading-only wrapper
- `createAsyncAction()` - Standard async action factory

### Consequences

**Positive:**
- ~70% reduction in error handling boilerplate
- Consistent error handling across all stores
- Centralized error logging with proper categories
- Single source of truth for error patterns
- Easier to add features (retry logic, error recovery, etc.)

**Negative:**
- Requires refactoring all stores (one-time cost)
- Slight learning curve for new developers

### Implementation
- Created `src/utils/storeHelpers.ts` with utility functions
- Refactored 11 stores to use centralized helpers:
  - apiKeyStore, healthStore, fileSystemStore, financialStore
  - githubStore, workflowStore, codeReviewStore, agentForgeStore
  - bytebotStore, toolStore, llmStore
- Maintained backward compatibility (no breaking changes)

### Files Affected
- Created: `src/utils/storeHelpers.ts`
- Updated: 11 store files in `src/services/`
- Removed: ~200+ lines of duplicate error handling code

### References
- See `OPTIMIZATION_SUMMARY.md` for full details

---

## Future ADRs

### ADR-009: Task-Based Model Routing (Planned)
**Status:** 📋 Planned  
**Decision:** Route tasks to specialized models based on task type
- Code generation → Coding models (DeepSeek Coder, Qwen2.5 Coder)
- Planning/Analysis → Reasoning models (Qwen reasoning distill)
- Vision tasks → Vision models (LLaVA, Qwen2-VL)
- General chat → General models (Mistral, Llama)

### ADR-009: Plugin System (Planned)
**Status:** 📋 Planned  
**Decision:** Create extensible plugin system for custom features

---

*Last Updated: January 2025*

