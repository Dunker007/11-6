# Component Patterns Guide

## Overview

This guide documents common patterns and best practices for React components in DLX Studios Ultimate.

## Component Structure

### Standard Component Template

```typescript
/**
 * ComponentName.tsx
 * 
 * PURPOSE:
 * [One sentence describing what this component does]
 * 
 * ARCHITECTURE:
 * [How it fits into the system, key dependencies]
 * 
 * CURRENT STATUS:
 * [Recent changes, optimizations, known issues]
 * 
 * DEPENDENCIES:
 * - [Service/Store]: [Purpose]
 * - [Component]: [Purpose]
 * 
 * STATE MANAGEMENT:
 * [What state it manages, how it's used]
 * 
 * PERFORMANCE:
 * [Optimizations, bottlenecks, considerations]
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * [Simple code example]
 * ```
 * 
 * RELATED FILES:
 * - [Related file]: [Relationship]
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - [Future improvement]
 */
import { useState, useEffect } from 'react';
import { useStore } from '@/services/store/store';
import { formatCurrency } from '@/utils/formatters';

interface ComponentProps {
  // Props definition
}

function ComponentName({ prop }: ComponentProps) {
  // Component implementation
}
```

## State Management Patterns

### Using Zustand Stores

**Basic Usage:**
```typescript
import { useProjectStore } from '@/services/project/projectStore';

function MyComponent() {
  const { activeProject, setActiveProject } = useProjectStore();
  
  const handleSelect = (id: string) => {
    setActiveProject(id);
  };
}
```

**Selective Subscriptions:**
```typescript
// Only subscribe to specific state
const activeProject = useProjectStore(state => state.activeProject);
const isLoading = useProjectStore(state => state.isLoading);
```

**Actions:**
```typescript
const { loadProjects, createProject } = useProjectStore();

useEffect(() => {
  loadProjects();
}, []);
```

### Local State Management

**Simple State:**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [value, setValue] = useState('');
```

**Complex State:**
```typescript
const [state, setState] = useState({
  isLoading: false,
  data: null,
  error: null,
});

// Update partial state
setState(prev => ({ ...prev, isLoading: true }));
```

## Performance Patterns

### React.memo

**When to Use:**
- Pure components with expensive renders
- Components that receive stable props
- Components in lists

**Example:**
```typescript
import { memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  // Expensive rendering logic
});
```

### useMemo

**When to Use:**
- Expensive calculations
- Derived state
- Filtering/sorting large arrays

**Example:**
```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory);
}, [items, selectedCategory]);
```

### useCallback

**When to Use:**
- Callbacks passed to memoized children
- Event handlers in lists
- Dependencies for other hooks

**Example:**
```typescript
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

### Lazy Loading

**Component Lazy Loading:**
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Common Patterns

### Loading States

```typescript
function DataComponent() {
  const { data, isLoading, error } = useDataStore();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
}
```

### Error Handling

```typescript
function Component() {
  const [error, setError] = useState<string | null>(null);
  
  const handleAction = async () => {
    try {
      setError(null);
      await performAction();
    } catch (err) {
      setError((err as Error).message);
      errorLogger.logFromError('component', err, 'error', {
        source: 'ComponentName',
      });
    }
  };
}
```

### Form Handling

```typescript
function FormComponent() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitForm(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
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
}
```

## Styling Patterns

### CSS Modules

```typescript
import styles from './Component.module.css';

function Component() {
  return <div className={styles.container}>Content</div>;
}
```

### CSS Variables

```css
.component {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--accent-primary);
}
```

### Conditional Classes

```typescript
const className = cn(
  'base-class',
  isActive && 'active-class',
  variant === 'primary' && 'primary-class'
);
```

## Component Composition

### Container/Presentational Pattern

```typescript
// Container (logic)
function ContainerComponent() {
  const { data, isLoading } = useDataStore();
  
  return <PresentationalComponent data={data} isLoading={isLoading} />;
}

// Presentational (UI)
function PresentationalComponent({ data, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />;
  return <DataDisplay data={data} />;
}
```

### Compound Components

```typescript
function Modal({ children }: { children: React.ReactNode }) {
  return <div className="modal">{children}</div>;
}

Modal.Header = function Header({ children }: { children: React.ReactNode }) {
  return <div className="modal-header">{children}</div>;
};

Modal.Body = function Body({ children }: { children: React.ReactNode }) {
  return <div className="modal-body">{children}</div>;
};

// Usage
<Modal>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
</Modal>
```

## Best Practices

1. **Always use TypeScript types**
2. **Use centralized utilities** (formatters, hooks)
3. **Provide loading and error states**
4. **Use React.memo for expensive components**
5. **Debounce expensive operations**
6. **Clean up effects** (return cleanup functions)
7. **Use consistent formatting** (currency, dates, percentages)
8. **Add file-level comments** explaining purpose

## Related Documentation

- `AI_TEAM_ONBOARDING.md` - Component patterns overview
- `docs/services/SERVICE_PATTERNS.md` - Service patterns
- `src/utils/formatters.ts` - Formatting utilities

