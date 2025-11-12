<!-- b3f28468-b274-4af1-92da-e84a2fb734af 0866e9a6-f7a0-4c0c-b793-7b2cc6559986 -->
# Documentation and Optimization Sprint

## Step 1: Add JSDoc to Components

Add function-level JSDoc comments to components missing them. Focus on critical components first.

### Priority Components (15-20 files):

- `src/components/APIKeyManager/APIKeyManager.tsx` - Add JSDoc to `APIKeyManager`, `handleAddKey`, `handleDeleteKey`, `checkAllHealth`
- `src/components/ui/Modal.tsx` - Add JSDoc to `Modal` component and props
- `src/components/ui/Input.tsx` - Add JSDoc to `Input` component
- `src/components/ui/CommandPalette.tsx` - Add JSDoc to `CommandPalette` and command handlers
- `src/components/Workflows/WorkflowRunner.tsx` - Add JSDoc to workflow execution methods
- `src/components/QuickLabs/CodeReview.tsx` - Add JSDoc to code review functions
- `src/components/LLMOptimizer/ModelCatalog.tsx` - Add JSDoc to model management functions
- `src/components/VibeEditor/VibeEditor.tsx` - Add JSDoc to editor methods
- `src/components/Activity/ActivityFeed.tsx` - Add JSDoc to activity rendering
- `src/components/Settings/Settings.tsx` - Add JSDoc to settings management

### JSDoc Template:

```typescript
/**
 * Component description
 * @param props - Component props
 * @returns JSX element
 */
```

## Step 2: Document Complex Algorithms

Add inline comments to complex calculation and algorithm functions.

### Files to Document:

- `src/services/backoffice/financialService.ts`
                                                                                                                                - `getSummary()` - Document profit margin calculation, category grouping logic
                                                                                                                                - `getExpenses()` / `getIncomeSources()` - Document date filtering algorithm
- `src/services/backoffice/thresholdService.ts`
                                                                                                                                - `checkThreshold()` - Document grace period calculation, projection algorithm
                                                                                                                                - `generateAlert()` - Document alert generation logic
- `src/services/health/healthMonitor.ts`
                                                                                                                                - `getSystemStats()` - Document parallel Promise.all pattern, GPU detection fallback
                                                                                                                                - `checkAlerts()` - Document threshold checking algorithm
- `src/services/ai/router.ts`
                                                                                                                                - `selectProvider()` - Document routing strategy logic, fallback chain
                                                                                                                                - `getFallbackProvider()` - Document fallback selection algorithm
- `src/services/apiKeys/apiKeyService.ts`
                                                                                                                                - `getEncryptionKey()` - Document Web Crypto API key generation/import
                                                                                                                                - `encrypt()` / `decrypt()` - Document encryption/decryption flow

### Comment Style:

- Explain "why" not just "what"
- Document edge cases and assumptions
- Include complexity notes where relevant

## Step 3: Add Task-Based Model Routing

Implement intelligent model selection based on task type (coding, vision, reasoning, etc.).

### Implementation:

1. **Add task type to GenerateOptions** (`src/types/llm.ts`):
   ```typescript
   export type TaskType = 'coding' | 'vision' | 'reasoning' | 'general' | 'function-calling';
   
   export interface GenerateOptions {
     // ... existing options
     taskType?: TaskType;
   }
   ```

2. **Create task routing logic** (`src/services/ai/router.ts`):

                                                                                                                                                                                                - Add `selectModelForTask()` method
                                                                                                                                                                                                - Map task types to model capabilities
                                                                                                                                                                                                - Update `selectProvider()` to check `options.taskType` first

3. **Update AIAssistant** (`src/components/AIAssistant/AIAssistant.tsx`):

                                                                                                                                                                                                - Detect task type from user input (keywords: "code", "explain", "refactor", "image", "analyze")
                                                                                                                                                                                                - Pass `taskType` to `streamGenerate()` options

4. **Add task detection utility** (`src/utils/taskDetector.ts`):

                                                                                                                                                                                                - `detectTaskType(prompt: string): TaskType`
                                                                                                                                                                                                - Use keyword matching and heuristics

### Files to Modify:

- `src/types/llm.ts` - Add `TaskType` and extend `GenerateOptions`
- `src/services/ai/router.ts` - Add task-based routing logic
- `src/components/AIAssistant/AIAssistant.tsx` - Add task detection
- `src/utils/taskDetector.ts` - Create new utility

## Step 4: Enhance Error Recovery Messages

Improve error messages to be user-friendly and actionable.

### Implementation:

1. **Create error message templates** (`src/services/errors/errorMessages.ts`):

                                                                                                                                                                                                - Map error categories to user-friendly messages
                                                                                                                                                                                                - Include recovery steps and suggestions

2. **Update ErrorLogger** (`src/services/errors/errorLogger.ts`):

                                                                                                                                                                                                - Add `getUserFriendlyMessage(error: CapturedError): string`
                                                                                                                                                                                                - Add `getRecoverySteps(error: CapturedError): string[]`
                                                                                                                                                                                                - Enhance `logError()` to include context hints

3. **Update error display components**:

                                                                                                                                                                                                - `src/components/shared/ErrorBoundary.tsx` - Show recovery steps
                                                                                                                                                                                                - `src/components/ErrorConsole/ErrorConsole.tsx` - Display user-friendly messages
                                                                                                                                                                                                - `src/components/AIAssistant/AIAssistant.tsx` - Show actionable error messages

4. **Add error context helpers** (`src/utils/errorHelpers.ts`):

                                                                                                                                                                                                - `suggestFix(error: Error): string`
                                                                                                                                                                                                - `isRetryable(error: Error): boolean`

### Error Categories to Enhance:

- LLM provider errors (unavailable, timeout, rate limit)
- File system errors (permission denied, not found)
- API key errors (invalid, expired, missing)
- Network errors (offline, timeout)

## Step 5: Performance Profiling and Optimization

Identify and optimize performance bottlenecks.

### Profiling Steps:

1. **Add performance markers** (`src/utils/performance.ts`):

                                                                                                                                                                                                - `measureAsync()` - Wrap async operations with timing
                                                                                                                                                                                                - `measureRender()` - Measure React component render times
                                                                                                                                                                                                - `logSlowOperations()` - Log operations > 100ms

2. **Profile key areas**:

                                                                                                                                                                                                - `src/services/ai/router.ts`
                                                                                                                                                                                                - `src/components/AIAssistant/AIAssistant.tsx`
                                                                                                                                                                                                - `src/services/health/healthMonitor.ts`
                                                                                                                                                                                                - `src/components/LLMOptimizer/ModelCatalog.tsx`

3. **Optimizations to apply**:

                                                                                                                                                                                                - Memoization (`useMemo`)
                                                                                                                                                                                                - Debouncing verification
                                                                                                                                                                                                - Lazy loading checks
                                                                                                                                                                                                - Virtual scrolling for long lists
                                                                                                                                                                                                - Batch state updates
                                                                                                                                                                                                - Provider health-check caching

4. **Create performance dashboard** (`src/components/System/PerformanceDashboard.tsx`):

                                                                                                                                                                                                - Render times, API durations, slow operations log, memory usage

### Files to Optimize:

- `src/services/ai/router.ts`
- `src/components/AIAssistant/AIAssistant.tsx`
- `src/components/LLMOptimizer/ModelCatalog.tsx`
- `src/services/health/healthMonitor.ts`
- `src/components/Activity/ActivityFeed.tsx`

## Step 6: Deep Re-Optimization & Executive Summary

After completing Steps 1-5, perform a comprehensive optimization pass and prepare executive-level reporting.

### Deep Re-Optimization Actions:

- Run repo-wide audit for redundant utilities, duplicate logic, unused assets
- Review bundle size, tree-shaking, and lazy-loading boundaries
- Verify Zustand stores follow `storeHelpers` patterns
- Re-validate Electron packaging (asar path, preload safety)
- Confirm AI provider priorities and fallbacks post-routing changes

### Executive Summary Deliverables:

- Create `docs/reports/EXECUTIVE_SUMMARY.md` summarizing:
                                                                                                                                - Work completed
                                                                                                                                - Architectural improvements
                                                                                                                                - Performance outcomes (before/after where possible)
                                                                                                                                - Remaining risks & next steps
- Update `CURRENT_SPRINT.md` with final sprint status

## Execution Order

1. Step 1 (JSDoc)
2. Step 2 (Algorithm docs)
3. Step 3 (Task routing)
4. Step 4 (Error messages)
5. Step 5 (Performance)
6. Step 6 (Deep re-optimization & summary)

## Success Criteria

- Priority components have function-level JSDoc
- Complex algorithms are documented inline
- Task-based routing selects appropriate models
- Error messages include recovery guidance
- Performance bottlenecks identified and improved
- Deep optimization audit completed with findings logged
- Executive summary delivered
- `npm run typecheck` passes
- No new lint errors introduced

### To-dos

- [ ] Analyze Project Structure and Dependencies
- [ ] Trace Application Entry Points
- [ ] Investigate the AI Service Layer and Core Logic
- [ ] Map Out UI Components and Features
- [ ] Review Project Documentation
- [ ] Synthesize findings into a summary