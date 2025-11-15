# Code Examples Library

## AI Services

### Generating a Plan

```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

const response = await aiServiceBridge.createPlan('Add a login page with email and password');

if (response.success && response.plan) {
  console.log(`Plan has ${response.plan.steps.length} steps`);
  response.plan.steps.forEach((step, index) => {
    console.log(`Step ${index + 1}: ${step.type} - ${step.thought || step.filePath}`);
  });
}
```

### Streaming LLM Generation

```typescript
import { useLLMStore } from '@/services/ai/llmStore';
import { getTemperatureForPriority } from '@/utils/llmConfig';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';

function ChatComponent() {
  const { streamGenerate } = useLLMStore();
  const priority = useLLMOptimizerStore(state => state.priority);
  
  const handleSend = async (prompt: string) => {
    const temperature = getTemperatureForPriority(priority);
    let fullText = '';
    
    for await (const chunk of streamGenerate(prompt, { temperature })) {
      if (chunk.text) {
        fullText += chunk.text;
        // Update UI with fullText
      }
      if (chunk.functionCalls) {
        // Handle function calls
        console.log('Function calls:', chunk.functionCalls);
      }
    }
  };
}
```

### Project Indexing

```typescript
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';

// Index a project
await aiServiceBridge.startIndexing('/path/to/project');

// Get project context
import { projectKnowledgeService } from '@/services/ai/projectKnowledgeService';
const context = projectKnowledgeService.getFullProjectContext();
console.log(context);
```

## State Management

### Using Zustand Store

```typescript
import { useProjectStore } from '@/services/project/projectStore';

function ProjectComponent() {
  const { 
    activeProject, 
    projects, 
    loadProjects, 
    createProject,
    setActiveProject 
  } = useProjectStore();
  
  useEffect(() => {
    loadProjects();
  }, []);
  
  const handleCreate = () => {
    const project = createProject('New Project', 'Description');
    setActiveProject(project.id);
  };
  
  return (
    <div>
      {projects.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
    </div>
  );
}
```

### Selective Store Subscription

```typescript
import { useWealthStore } from '@/services/wealth/wealthStore';

function PortfolioComponent() {
  // Only subscribe to portfolios, not all wealth state
  const portfolios = useWealthStore(state => state.portfolios);
  const selectedPortfolioId = useWealthStore(state => state.selectedPortfolioId);
  
  const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);
  
  return <PortfolioDisplay portfolio={selectedPortfolio} />;
}
```

## Formatting

### Currency Formatting

```typescript
import { formatCurrency, formatCompactCurrency } from '@/utils/formatters';

// Standard formatting
formatCurrency(1234.56); // "$1,234.56"

// Whole dollars (financial standard)
formatCurrency(1234.56, { 
  minimumFractionDigits: 0, 
  maximumFractionDigits: 0 
}); // "$1,235"

// Compact notation
formatCompactCurrency(1234567); // "$1.2M"
```

### Percentage Formatting

```typescript
import { formatPercent } from '@/utils/formatters';

// Standard
formatPercent(0.15); // "15.0%"

// With decimals and + sign (financial standard)
formatPercent(0.15, 2, false, true); // "+15.00%"

// Negative values
formatPercent(-0.15, 2, false, true); // "-15.00%"
```

### Date Formatting

```typescript
import { formatDate } from '@/utils/formatters';

// Medium format
formatDate(new Date(), 'medium'); // "Jan 15, 2025"

// Relative time
formatDate(new Date(Date.now() - 3600000), 'relative'); // "1 hour ago"

// Datetime
formatDate(new Date(), 'datetime'); // "Jan 15, 2025, 02:30 PM"
```

## Error Handling

### Service Error Handling

```typescript
import { errorLogger } from '@/services/errors/errorLogger';

async function performOperation(): Promise<{ success: boolean; data?: Data; error?: string }> {
  try {
    const data = await fetchData();
    return { success: true, data };
  } catch (error) {
    errorLogger.logFromError('service', error, 'error', {
      source: 'ServiceName',
      operation: 'performOperation',
    });
    return { success: false, error: (error as Error).message };
  }
}
```

### Component Error Handling

```typescript
import { errorLogger } from '@/services/errors/errorLogger';
import { useToast } from '@/components/ui';

function Component() {
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  
  const handleAction = async () => {
    try {
      setError(null);
      await performAction();
      showToast({
        variant: 'success',
        title: 'Success',
        message: 'Operation completed',
      });
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      errorLogger.logFromError('component', err, 'error', {
        source: 'ComponentName',
      });
      showToast({
        variant: 'error',
        title: 'Error',
        message: errorMessage,
      });
    }
  };
}
```

## File Operations

### File System Operations

```typescript
import { fileSystemService } from '@/services/filesystem/fileSystemService';

// Read file
const readResult = await fileSystemService.readFile('/path/to/file.ts');
if (readResult.success && readResult.data) {
  console.log(readResult.data);
}

// Write file
const writeResult = await fileSystemService.writeFile('/path/to/file.ts', content);
if (writeResult.success) {
  console.log('File written successfully');
}

// Find large files
const largeFilesResult = await fileSystemService.findLargeFiles('/path/to/dir', 100);
if (largeFilesResult.success && largeFilesResult.data) {
  console.log(`Found ${largeFilesResult.data.length} large files`);
}
```

### Project File Operations

```typescript
import { useProjectStore } from '@/services/project/projectStore';

function FileComponent() {
  const { updateFile, addFile, getFileContent, activeFile } = useProjectStore();
  
  const handleSave = (content: string) => {
    if (activeFile) {
      updateFile(activeFile, content);
    }
  };
  
  const handleCreate = () => {
    addFile('src/new.tsx', '// New file', 'typescript');
  };
  
  const content = activeFile ? getFileContent(activeFile) : null;
  
  return <Editor content={content} onSave={handleSave} />;
}
```

## Activity Logging

### Logging Activities

```typescript
import { useActivityStore } from '@/services/activity/activityStore';

function Component() {
  const { addActivity } = useActivityStore();
  
  const handleAction = () => {
    addActivity('project', 'created', 'Created new project', {
      projectId: project.id,
      projectName: project.name,
    });
  };
}
```

## Performance Optimization

### Memoization

```typescript
import { useMemo } from 'react';

function Component({ items, filter }: Props) {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);
  
  return <ItemList items={filteredItems} />;
}
```

### Debouncing

```typescript
import { useDebounce } from '@/utils/hooks/useDebounce';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
}
```

### React.memo

```typescript
import { memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  // Expensive rendering
  return <ComplexVisualization data={data} />;
});
```

## Related Documentation

- `docs/patterns/COMMON_PATTERNS.md` - More pattern examples
- `docs/components/COMPONENT_PATTERNS.md` - Component patterns
- `docs/services/SERVICE_PATTERNS.md` - Service patterns

