# AI Services Guide

## Overview

This guide provides comprehensive documentation for the AI services architecture in DLX Studios Ultimate. All AI services run in the renderer process for optimal performance.

## Architecture

### Renderer-Side AI Architecture

**Key Decision (Nov 2025):** All AI services moved from Electron main process to renderer process.

**Benefits:**
- 60% faster startup (2-3s vs 5-8s)
- 35% less memory usage (~280MB vs ~430MB)
- Zero IPC overhead
- No chat lockups
- Works offline with graceful fallbacks

### Service Hierarchy

```
aiServiceBridge.ts (main entry point)
├── router.ts (LLM routing)
│   ├── providers/localLLM.ts (LM Studio, Ollama)
│   └── providers/cloudLLM.ts (Gemini, NotebookLM, Ollama Cloud)
├── multiFileContextService.ts (project analysis)
├── projectKnowledgeService.ts (knowledge management)
└── refactoringEngine.ts (code refactoring)
```

## Core Services

### aiServiceBridge.ts

**Purpose:** Main entry point for all AI operations.

**Key Methods:**
- `startIndexing(projectRoot)` - Index and analyze project
- `createPlan(prompt)` - Generate execution plan
- `structureIdea(rawText)` - Structure unstructured ideas
- `turboEdit(selectedCode, instruction, filePath?)` - AI-powered code editing
- `generateResponse(prompt)` - Simple text generation

**Usage:**
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Index a project
await aiServiceBridge.startIndexing('/path/to/project');

// Generate a plan
const response = await aiServiceBridge.createPlan('Add login page');
if (response.success && response.plan) {
  console.log(`Plan has ${response.plan.steps.length} steps`);
}
```

### router.ts

**Purpose:** Intelligent LLM provider routing and management.

**Providers Supported:**
- Local: LM Studio, Ollama
- Cloud: Gemini, NotebookLM, Ollama Cloud, OpenRouter

**Strategies:**
- `local-only` - Only use local providers
- `local-first` - Try local, no fallback
- `cloud-fallback` - Try local, fallback to cloud
- `hybrid` - Best provider for task (future)

**Usage:**
```typescript
import { llmRouter } from '@/services/ai/router';

// Discover providers
const providers = await llmRouter.discoverProviders();

// Generate text
const response = await llmRouter.generate('Hello!', {
  temperature: 0.7,
  maxTokens: 100
});

// Stream generation
for await (const chunk of llmRouter.streamGenerate('Tell a story')) {
  if (chunk.text) console.log(chunk.text);
  if (chunk.functionCalls) console.log('Functions:', chunk.functionCalls);
}
```

### multiFileContextService.ts

**Purpose:** Deep project analysis and dependency tracking.

**Features:**
- Parses imports, exports, functions, classes
- Builds dependency graphs
- Detects cycles, orphans, hotspots
- Resolves import paths
- Groups files by language

**Usage:**
```typescript
import { multiFileContextService } from '@/services/ai/multiFileContextService';

// Analyze project
const context = await multiFileContextService.analyzeProject(project);

// Get related files
const related = multiFileContextService.getRelatedFiles(projectId, 'src/utils.ts', 2);

// Generate AI context prompt
const prompt = multiFileContextService.generateContextPrompt(projectId, ['src/app.tsx']);

// Get graph insights
const insights = multiFileContextService.getGraphInsights(projectId);
console.log(`Cycles: ${insights?.cycles.length}`);
```

### projectKnowledgeService.ts

**Purpose:** High-level project knowledge management.

**Features:**
- Language detection
- Framework detection
- Dependency extraction
- Structure analysis (config, tests, docs, entry points)
- Navigation suggestions

**Usage:**
```typescript
import { projectKnowledgeService } from '@/services/ai/projectKnowledgeService';

// Get project knowledge
const knowledge = projectKnowledgeService.getProjectKnowledge(projectId);
console.log(`Languages: ${knowledge?.languages.join(', ')}`);

// Get full context for AI
const context = projectKnowledgeService.getFullProjectContext();

// Get navigation suggestion
const suggestion = projectKnowledgeService.suggestNavigation('I want to deploy my app');
```

## LLM Providers

### Local Providers

**LM Studio Provider:**
- Default port: 1234
- Endpoint: `http://localhost:1234/v1`
- Supports health checks, model discovery, generation, streaming

**Ollama Provider:**
- Default port: 11434
- Endpoint: `http://localhost:11434`
- Supports health checks, model discovery, generation, streaming
- Model pulling support

### Cloud Providers

**Gemini Provider:**
- Function calling support
- Vision capabilities
- Long context (up to 2M tokens)
- Safety settings
- System instructions
- Tool definitions

**NotebookLM Provider:**
- Document-aware generation
- Source grounding

**Ollama Cloud Provider:**
- Same API format as local Ollama
- Cloud-hosted endpoint (`https://ollama.com/api`)
- Optional API key authentication
- Same model discovery and generation endpoints
- Streaming support

## State Management

### llmStore.ts

Zustand store for LLM state:
- Models list
- Active model selection
- Provider availability
- Generation operations
- Model pulling

**Usage:**
```typescript
import { useLLMStore } from '@/services/ai/llmStore';

function MyComponent() {
  const { models, activeModel, streamGenerate, isLoading } = useLLMStore();
  
  const handleGenerate = async () => {
    for await (const chunk of streamGenerate('Hello!')) {
      if (chunk.text) console.log(chunk.text);
      if (chunk.functionCalls) console.log('Functions:', chunk.functionCalls);
    }
  };
}
```

## Common Patterns

### Using AI Services

**Always use aiServiceBridge:**
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
await aiServiceBridge.createPlan('Add feature');
```

**Never use IPC:**
```typescript
// ❌ WRONG
window.ipcRenderer.invoke('ai:createPlan', ...);

// ✅ CORRECT
await aiServiceBridge.createPlan(...);
```

### Error Handling

**Always provide fallbacks:**
```typescript
try {
  const response = await aiServiceBridge.createPlan(prompt);
  if (response.success) {
    // Use plan
  } else {
    // Handle error
  }
} catch (error) {
  // Fallback to mock plan or show error
}
```

### Temperature Configuration

**Use dynamic temperature:**
```typescript
import { getTemperatureForPriority } from '@/utils/llmConfig';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';

const priority = useLLMOptimizerStore(state => state.priority);
const temperature = getTemperatureForPriority(priority);

await llmRouter.generate(prompt, { temperature });
```

## Performance Considerations

1. **No IPC Overhead:** All AI services run in renderer
2. **Async Operations:** Don't block UI thread
3. **Caching:** Project context is cached
4. **Lazy Loading:** Heavy operations run async
5. **Streaming:** Use streaming for real-time responses

## Troubleshooting

### "No LLM providers available"
- Check local providers (LM Studio/Ollama running?)
- Check API keys for cloud providers
- Verify provider health checks

### "Chat locks up"
- Fixed in Nov 2025 consolidation
- Ensure using renderer-side services
- Check for blocking operations

### "Function calls not working"
- Ensure using Gemini provider
- Check tools/function definitions
- Verify streaming implementation

## Related Documentation

- `AI_SERVICES_CONSOLIDATION.md` - Why renderer-side architecture
- `ARCHITECTURE_DECISIONS.md` - ADR-001: Renderer-Side AI Services
- `QUICK_REFERENCE.md` - Quick usage examples

