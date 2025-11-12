# Common Patterns Guide

## Overview

This guide documents common code patterns used throughout DLX Studios Ultimate.

## AI Service Patterns

### Using AI Services

**Always use aiServiceBridge:**
```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Index project
await aiServiceBridge.startIndexing('/path/to/project');

// Generate plan
const response = await aiServiceBridge.createPlan('Add feature');
if (response.success && response.plan) {
  // Use plan
}

// Structure idea
const idea = await aiServiceBridge.structureIdea('Build a chat app');
```

**Never use IPC:**
```typescript
// ❌ WRONG
window.ipcRenderer.invoke('ai:createPlan', ...);

// ✅ CORRECT
await aiServiceBridge.createPlan(...);
```

### LLM Generation

**Synchronous:**
```typescript
import { llmRouter } from '@/services/ai/router';

const response = await llmRouter.generate('Hello!', {
  temperature: 0.7,
  maxTokens: 1000,
});
console.log(response.text);
```

**Streaming:**
```typescript
import { llmRouter } from '@/services/ai/router';

for await (const chunk of llmRouter.streamGenerate('Tell a story')) {
  if (chunk.text) {
    console.log(chunk.text);
  }
  if (chunk.functionCalls) {
    console.log('Function calls:', chunk.functionCalls);
  }
}
```

**With Dynamic Temperature:**
```typescript
import { getTemperatureForPriority } from '@/utils/llmConfig';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';

const priority = useLLMOptimizerStore(state => state.priority);
const temperature = getTemperatureForPriority(priority);

await llmRouter.generate(prompt, { temperature });
```

## State Management Patterns

### Zustand Store Usage

**Basic:**
```typescript
import { useProjectStore } from '@/services/project/projectStore';

const { activeProject, setActiveProject } = useProjectStore();
```

**Selective:**
```typescript
// Only subscribe to specific state
const activeProject = useProjectStore(state => state.activeProject);
```

**Actions:**
```typescript
const { loadProjects, createProject } = useProjectStore();

useEffect(() => {
  loadProjects();
}, []);
```

### Store Actions

**Async Actions:**
```typescript
loadData: async () => {
  set({ isLoading: true, error: null });
  try {
    const data = await service.getAll();
    set({ data, isLoading: false });
  } catch (error) {
    set({ error: (error as Error).message, isLoading: false });
  }
},
```

## Formatting Patterns

### Currency Formatting

```typescript
import { formatCurrency } from '@/utils/formatters';

// Standard
formatCurrency(1234.56); // "$1,234.56"

// Whole dollars
formatCurrency(1234.56, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); // "$1,235"

// Compact
formatCompactCurrency(1234567); // "$1.2M"
```

### Percentage Formatting

```typescript
import { formatPercent } from '@/utils/formatters';

// Standard
formatPercent(0.15); // "15.0%"

// With decimals
formatPercent(0.15, 2); // "15.00%"

// With + sign
formatPercent(0.15, 2, false, true); // "+15.00%"

// Already percentage
formatPercent(15, 1, true); // "15.0%"
```

### Date Formatting

```typescript
import { formatDate } from '@/utils/formatters';

// Medium format
formatDate(new Date(), 'medium'); // "Jan 15, 2025"

// Short format
formatDate(new Date(), 'short'); // "1/15/25"

// Relative
formatDate(new Date(), 'relative'); // "2 hours ago"

// Datetime
formatDate(new Date(), 'datetime'); // "Jan 15, 2025, 02:30 PM"
```

### Bytes Formatting

```typescript
import { formatBytes } from '@/utils/formatters';

formatBytes(1024); // "1 KB"
formatBytes(1048576); // "1 MB"
formatBytes(1073741824); // "1 GB"
```

## Error Handling Patterns

### Try-Catch with Logging

```typescript
import { errorLogger } from '@/services/errors/errorLogger';

try {
  await performOperation();
} catch (error) {
  errorLogger.logFromError('category', error, 'error', {
    source: 'ComponentName',
    operation: 'performOperation',
  });
  // Handle error
}
```

### Service Error Handling

```typescript
async performOperation(): Promise<{ success: boolean; data?: Data; error?: string }> {
  try {
    const data = await fetchData();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

### Component Error Handling

```typescript
function Component() {
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      setError(null);
      await performAction();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  if (error) return <ErrorMessage error={error} />;
  return <ComponentContent />;
}
```

## Activity Logging Patterns

### Logging Activities

```typescript
import { useActivityStore } from '@/services/activity/activityStore';

const { addActivity } = useActivityStore();

addActivity('project', 'created', 'Created new project');
addActivity('file', 'edited', 'Updated app.tsx');
```

### Activity with Metadata

```typescript
addActivity('ai', 'plan-generated', 'Generated execution plan', {
  planId: plan.id,
  stepCount: plan.steps.length,
});
```

## File Operations Patterns

### File System Operations

```typescript
import { fileSystemService } from '@/services/filesystem/fileSystemService';

// Read file
const result = await fileSystemService.readFile('/path/to/file');
if (result.success && result.data) {
  console.log(result.data);
}

// Write file
await fileSystemService.writeFile('/path/to/file', content);

// Find large files
const largeFiles = await fileSystemService.findLargeFiles('/path/to/dir', 100);
```

### Project File Operations

```typescript
import { useProjectStore } from '@/services/project/projectStore';

const { updateFile, addFile, deleteFile, getFileContent } = useProjectStore();

// Update file
updateFile('src/app.tsx', newContent);

// Add file
addFile('src/new.tsx', content, 'typescript');

// Get file content
const content = getFileContent('src/app.tsx');
```

## Performance Patterns

### Debouncing

```typescript
import { useDebounce } from '@/utils/hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

### Memoization

```typescript
import { useMemo } from 'react';

const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory);
}, [items, selectedCategory]);
```

### Callback Memoization

```typescript
import { useCallback } from 'react';

const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

## Toast Notifications

### Showing Toasts

```typescript
import { useToast } from '@/components/ui';

const { showToast } = useToast();

showToast({
  variant: 'success',
  title: 'Success',
  message: 'Operation completed successfully',
});

showToast({
  variant: 'error',
  title: 'Error',
  message: 'Operation failed',
});

showToast({
  variant: 'info',
  title: 'Info',
  message: 'Processing...',
});
```

## Related Documentation

- `docs/components/COMPONENT_PATTERNS.md` - Component patterns
- `docs/services/SERVICE_PATTERNS.md` - Service patterns
- `AI_TEAM_ONBOARDING.md` - Overview of patterns

