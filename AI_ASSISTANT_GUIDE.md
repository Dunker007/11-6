# AI Assistant Guide - Vibed Ed Codebase

> **Critical Guide for AI Assistants (Cursor AI, Claude, GPT, etc.) Working on This Project**

---

## 🚨 READ THIS FIRST

### The Most Important Thing to Know

**In November 2025, we REMOVED all AI services from the Electron main process due to performance issues (chat lockup, heavy dependencies).**

If you try to recreate these files, you will break the application:
- ❌ `electron/ai/knowledgeGraph.ts`
- ❌ `electron/ai/projectIndexer.ts`
- ❌ `electron/ai/semanticRetriever.ts`
- ❌ `electron/ai/workflowEngine.ts`
- ❌ `electron/ai/llmService.ts`
- ❌ `electron/ipcHandlers.ts` (for AI services)

### What to Use Instead

✅ **Single Entry Point:** `src/services/ai/aiServiceBridge.ts`

```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Everything you need:
await aiServiceBridge.startIndexing(projectRoot);
await aiServiceBridge.createPlan(prompt);
await aiServiceBridge.structureIdea(rawText);
```

**Why?** This runs in the renderer process with zero IPC overhead, graceful fallbacks, and no heavy dependencies.

📖 **Full Context:** [`AI_SERVICES_CONSOLIDATION.md`](./AI_SERVICES_CONSOLIDATION.md)

---

## 🎯 Your Mission as an AI Assistant

When working on this codebase, you should:

1. **Understand the architecture** (renderer-side AI, no IPC)
2. **Follow established patterns** (see examples below)
3. **Maintain performance** (lazy loading, code splitting, cleanup)
4. **Never recreate deleted services** (use aiServiceBridge)
5. **Document changes** (update relevant .md files)

---

## 📐 Architecture Overview

### Process Separation

```
┌─────────────────────────────────────────┐
│     Electron Main Process               │
│  - File system (fs:* IPC handlers)      │
│  - Process management (run:* handlers)  │
│  - GitHub integration (git:* handlers)  │
│  - Window management                    │
│  - Auto-updates                         │
│  ❌ NO AI SERVICES                      │
└─────────────────────────────────────────┘
           ↕️ (IPC for file/git ops)
┌─────────────────────────────────────────┐
│     Renderer Process (React)            │
│  ✅ ALL AI SERVICES HERE                │
│  - aiServiceBridge (main entry)         │
│  - llmRouter (LLM routing)              │
│  - multiFileContextService (analysis)   │
│  - projectKnowledgeService (knowledge)  │
│  - refactoringEngine (code transforms)  │
│  - UI components                        │
└─────────────────────────────────────────┘
```

### AI Service Flow

```
User Action (e.g., "Generate Plan")
    ↓
Component (e.g., VibeBar.tsx)
    ↓
aiServiceBridge.createPlan(prompt)
    ↓
llmRouter.generate(fullPrompt) ← Tries configured LLM
    ↓                              (LM Studio, Ollama, Gemini, etc.)
    ├─ Success → Parse JSON → Return plan
    └─ Failure → generateMockPlan() → Return fallback
```

**Key Points:**
- No IPC involved (all in renderer)
- Always has a fallback (works offline)
- Fast (no process boundaries)

---

## 🛠️ Common Tasks & How to Do Them

### Task 1: Add a New AI Feature

**❌ Wrong Approach:**
```typescript
// Don't create new Electron AI services!
// electron/ai/myNewFeature.ts

// Don't use IPC for AI
ipcMain.handle('ai:myFeature', async () => { ... });
```

**✅ Correct Approach:**
```typescript
// Extend aiServiceBridge (src/services/ai/aiServiceBridge.ts)

class AIServiceBridge {
  // ... existing methods ...

  async myNewFeature(input: string): Promise<MyResult> {
    try {
      // Try LLM first
      const response = await llmRouter.generate(prompt, {
        temperature: 0.91,
        maxTokens: 1024,
      });
      
      const result = parseResponse(response.text);
      return result;
    } catch (error) {
      console.warn('LLM failed, using fallback:', error);
      // Always provide a fallback!
      return this.generateMockResult(input);
    }
  }

  private generateMockResult(input: string): MyResult {
    // Simple fallback logic
    return { /* ... */ };
  }
}
```

### Task 2: Use AI in a Component

**✅ Pattern:**
```typescript
import React, { useState } from 'react';
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

const MyComponent = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const response = await aiServiceBridge.createPlan('My task');
      if (response.success) {
        setResult(response.plan);
      } else {
        console.error('Plan generation failed:', response.error);
        // Show error to user
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      // Error already logged by aiServiceBridge
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Plan'}
      </button>
      {result && <div>Plan: {JSON.stringify(result)}</div>}
    </div>
  );
};
```

### Task 3: Add Error Handling

**✅ Pattern:**
```typescript
import { errorLogger } from '@/services/errors/errorLogger';

try {
  await someOperation();
} catch (error) {
  errorLogger.logFromError(error, {
    category: 'ai', // or 'system', 'network', 'user', 'unknown'
    source: 'MyComponent.handleAction',
    severity: 'high',
    context: {
      userId: activeProject?.id,
      action: 'generatePlan',
    },
  });
  // Handle gracefully (show error to user, provide fallback, etc.)
}
```

### Task 4: Add Activity Logging

**✅ Pattern:**
```typescript
import { activityService } from '@/services/activity/activityService';

activityService.logActivity({
  type: 'ai', // or 'project', 'deploy', 'git', 'system', 'monetize'
  action: 'Plan generated',
  description: `Created execution plan for: "${prompt}"`,
  metadata: {
    planSteps: plan.steps.length,
    usedLLM: true,
  },
});
```

### Task 5: Add a New Component

**✅ File Structure:**
```
src/components/MyWorkflow/
├── index.tsx              # Main component (default export)
├── SubComponent.tsx       # Sub-components
├── AnotherPart.tsx
└── types.ts               # Local types (if needed)
```

**✅ Main Component Template:**
```typescript
import React, { useState, useEffect } from 'react';
import '../../styles/MyWorkflow.css';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';

const MyWorkflow = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Side effect
    return () => {
      // ⚠️ IMPORTANT: Always clean up!
      // Clear timers, unsubscribe, etc.
    };
  }, [dependencies]);

  return (
    <div className="my-workflow-container">
      <div className="my-workflow-header">
        <TechIcon icon={ICON_MAP.workflow} size={24} />
        <h2>My Workflow</h2>
      </div>
      {/* ... content ... */}
    </div>
  );
};

export default MyWorkflow;
```

### Task 6: Lazy Load a Heavy Component

**✅ Pattern:**
```typescript
// In parent component (e.g., CenterPanel.tsx)
import React, { lazy, Suspense } from 'react';

const MyHeavyWorkflow = lazy(() => import('./MyWorkflow'));

const CenterPanel = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyHeavyWorkflow />
    </Suspense>
  );
};
```

---

## 🎓 Key Patterns & Best Practices

### 1. LLM Calls - Always Use Temperature 0.91

```typescript
// ✅ Correct
const response = await llmRouter.generate(prompt, {
  temperature: 0.91, // Creative tasks
  maxTokens: 2048,
});

// ❌ Wrong
const response = await llmRouter.generate(prompt, {
  temperature: 0.7, // Old default, changed in Nov 2025
});
```

### 2. Always Provide Fallbacks

```typescript
// ✅ Correct
async myAIFeature(input: string): Promise<Result> {
  try {
    // Try LLM
    const response = await llmRouter.generate(...);
    return parseResponse(response.text);
  } catch (error) {
    console.warn('LLM unavailable, using fallback');
    return this.generateMockResult(input); // ← Fallback
  }
}

// ❌ Wrong
async myAIFeature(input: string): Promise<Result> {
  const response = await llmRouter.generate(...); // ← Can throw!
  return parseResponse(response.text); // ← No fallback
}
```

### 3. Clean Up Effects

```typescript
// ✅ Correct
useEffect(() => {
  const timer = setTimeout(() => {
    doSomething();
  }, 1000);

  return () => clearTimeout(timer); // ← Clean up
}, [dependencies]);

// ❌ Wrong
useEffect(() => {
  setTimeout(() => {
    doSomething();
  }, 1000); // ← No cleanup, memory leak!
}, [dependencies]);
```

### 4. Use Absolute Imports

```typescript
// ✅ Correct
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
import { errorLogger } from '@/services/errors/errorLogger';
import TechIcon from '@/components/Icons/TechIcon';

// ❌ Wrong (relative imports get messy)
import { aiServiceBridge } from '../../services/ai/aiServiceBridge';
```

### 5. Type Safety

```typescript
// ✅ Correct
import type { Plan, PlanResponse } from '@/types/plan';

const [plan, setPlan] = useState<Plan | null>(null);

const response: PlanResponse = await aiServiceBridge.createPlan(prompt);

// ❌ Wrong
const [plan, setPlan] = useState(null); // ← Implicit any
const response = await aiServiceBridge.createPlan(prompt); // ← Untyped
```

---

## 🚫 Common Mistakes & How to Avoid Them

### Mistake 1: Recreating Deleted Services

**❌ Don't Do This:**
```typescript
// Creating electron/ai/projectIndexer.ts
import chokidar from 'chokidar';
import * as ts from 'typescript';

export class ProjectIndexer {
  // This will cause the same performance issues we fixed!
}
```

**✅ Do This Instead:**
```typescript
// Use existing multiFileContextService
import { multiFileContextService } from '@/services/ai/multiFileContextService';

await multiFileContextService.analyzeProject(project);
```

### Mistake 2: Using IPC for AI Operations

**❌ Don't Do This:**
```typescript
// In component
const result = await window.ipcRenderer.invoke('ai:createPlan', prompt);
```

**✅ Do This Instead:**
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
const result = await aiServiceBridge.createPlan(prompt);
```

### Mistake 3: No Fallback for LLM Calls

**❌ Don't Do This:**
```typescript
async generateCode(prompt: string): Promise<string> {
  const response = await llmRouter.generate(prompt); // ← Can fail!
  return response.text; // ← User gets error
}
```

**✅ Do This Instead:**
```typescript
async generateCode(prompt: string): Promise<string> {
  try {
    const response = await llmRouter.generate(prompt);
    return response.text;
  } catch (error) {
    console.warn('LLM unavailable, returning template');
    return this.getCodeTemplate(prompt); // ← Graceful fallback
  }
}
```

### Mistake 4: Memory Leaks in useEffect

**❌ Don't Do This:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
  // ← No cleanup! Interval keeps running after unmount
}, []);
```

**✅ Do This Instead:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);
  
  return () => clearInterval(interval); // ← Clean up
}, []);
```

### Mistake 5: Wrong Import Paths After Consolidation

**❌ Don't Do This:**
```typescript
// This file doesn't exist anymore!
import { Plan } from '../../../electron/ai/workflowEngine';
```

**✅ Do This Instead:**
```typescript
// Types moved to src/types/
import type { Plan } from '@/types/plan';
```

---

## 📊 Performance Guidelines

### Code Splitting

**vite.config.ts already configured for:**
- `react` - React library
- `monaco` - Monaco Editor
- `markdown` - Markdown rendering
- `ai` - AI services
- `icons` - Lucide icons
- `zustand` - State management
- `vendor` - Other dependencies

**When to add more chunks:**
- Heavy third-party libraries (> 100KB)
- Rarely-used features
- Dynamically loaded workflows

### Lazy Loading

**Already lazy loaded:**
- Workflows in CenterPanel
- Monaco Editor in VibeEditor
- QuickLabs components (MindMap, CodeReview, etc.)

**When to lazy load:**
- Components > 50KB
- Heavy dependencies (charts, 3D, video)
- Features used by < 50% of users

### Debouncing

**Use `useDebounce` hook for:**
- Search inputs
- Auto-save
- Real-time validation
- API calls triggered by typing

```typescript
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';

const handleSearch = useDebouncedCallback((query: string) => {
  performSearch(query);
}, 300); // 300ms delay
```

---

## 📝 Documentation Requirements

### When You Make Changes

1. **Code Comments** - Add comments for complex logic
2. **Type Definitions** - Update `src/types/` if needed
3. **README Updates** - Update README.md if user-facing
4. **Architecture Docs** - Update AI_SERVICES_CONSOLIDATION.md if AI-related
5. **Quick Reference** - Update QUICK_REFERENCE.md if API changes

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `perf:` Performance improvement
- `docs:` Documentation only
- `style:` Formatting (no code change)
- `test:` Adding tests
- `chore:` Maintenance

**Example:**
```
feat: Add semantic code search to aiServiceBridge

Implemented semantic search using cosine similarity on code embeddings.
Falls back to simple text search when embeddings unavailable.

- Added searchCode() method to aiServiceBridge
- Updated QUICK_REFERENCE.md with usage examples
- Added types to src/types/search.ts
```

---

## 🧪 Testing Guidelines

### Before Committing

1. **Type Check:** `npm run typecheck` - Must pass!
2. **Manual Test:** Start dev server, test your changes
3. **Check Console:** No errors in browser console
4. **Test Offline:** Verify fallbacks work without LLM

### Manual Testing Checklist

- [ ] Dev server starts (`npm run dev`)
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] AI features work with LLM configured
- [ ] AI features fallback gracefully when LLM unavailable
- [ ] No performance regression (startup < 5s)
- [ ] No memory leaks (check DevTools Memory tab)

---

## 🎯 Decision Matrix: When to Use What

### When to Use `aiServiceBridge`
- ✅ Generate execution plans
- ✅ Structure user ideas
- ✅ Index/analyze projects
- ✅ Any AI operation that needs context

### When to Use `llmRouter` Directly
- ✅ Custom prompts not covered by aiServiceBridge
- ✅ Streaming responses (use `streamGenerate`)
- ✅ Specialized AI features (after considering adding to aiServiceBridge)

### When to Use `multiFileContextService`
- ✅ Analyzing project dependencies
- ✅ Building file relationship graphs
- ✅ Understanding project structure

### When to Use `refactoringEngine`
- ✅ Rename symbols across files
- ✅ Extract methods/functions
- ✅ Optimize imports
- ✅ Move files and update imports

### When to Use IPC (Electron)
- ✅ File system operations (`fs:readFile`, `fs:writeFile`, etc.)
- ✅ Process management (`run:program`, `run:stop`, etc.)
- ✅ Git operations (`git:clone`, `git:commit`, etc.)
- ❌ **NEVER for AI operations** (use aiServiceBridge)

---

## 🔍 How to Investigate Issues

### Step 1: Check Console
```javascript
// Open DevTools: Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
// Check for errors in Console tab
```

### Step 2: Check Error Logger
```typescript
import { errorLogger } from '@/services/errors/errorLogger';

// Get all errors
const errors = errorLogger.getErrors();
console.table(errors);

// Get recent errors
const recent = errors.filter(e => 
  Date.now() - e.timestamp < 60000 // Last minute
);
```

### Step 3: Check LLM Status
```typescript
import { useLLMStore } from '@/services/ai/llmStore';

const llmStore = useLLMStore.getState();
console.log('Active Provider:', llmStore.activeProvider);
console.log('Active Model:', llmStore.activeModel);
console.log('Connection Status:', llmStore.connectionStatus);
```

### Step 4: Test AI Service
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Test plan generation
const response = await aiServiceBridge.createPlan('Add a button');
console.log('Plan Response:', response);

// Check if using mock or real LLM
if (response.plan?.steps[0]?.thought?.includes('mock')) {
  console.warn('Using mock plan - LLM may be unavailable');
}
```

---

## 📞 Getting Help

### Documentation Hierarchy
1. **`.cursorrules`** - Quick architecture rules
2. **`AI_SERVICES_CONSOLIDATION.md`** - Deep dive on AI services
3. **`QUICK_REFERENCE.md`** - API usage examples
4. **This file** - Detailed guide for AI assistants
5. **`README.md`** - General project overview

### Key Files to Read
- **Architecture:** `AI_SERVICES_CONSOLIDATION.md`
- **Usage:** `QUICK_REFERENCE.md`
- **Verification:** `VERIFICATION_COMPLETE.md`
- **Rules:** `.cursorrules`

### When in Doubt
1. Read `AI_SERVICES_CONSOLIDATION.md` (comprehensive)
2. Check `src/services/ai/aiServiceBridge.ts` (implementation)
3. Look at existing components for patterns
4. Ask the user for clarification

---

## ✅ Quick Checklist for AI Assistants

Before suggesting code changes:
- [ ] Have you read `.cursorrules`?
- [ ] Do you understand the renderer-side AI architecture?
- [ ] Are you using `aiServiceBridge` instead of IPC?
- [ ] Have you provided fallbacks for LLM calls?
- [ ] Are you using temperature 0.91 for creative tasks?
- [ ] Are you cleaning up effects/timers?
- [ ] Are you using absolute imports (`@/...`)?
- [ ] Will this work offline (graceful degradation)?
- [ ] Does this follow existing patterns?
- [ ] Will you update documentation if needed?

---

**Last Updated:** November 8, 2025  
**Major Change:** AI Services Consolidation (removed electron/ai/, use aiServiceBridge)  
**Status:** Active - Follow these guidelines for all changes

