# Service Patterns Guide

## Overview

This guide documents common patterns and best practices for services in DLX Studios Ultimate.

## Service Architecture

### Service Types

1. **Stateless Services** - Pure functions, no internal state
2. **Singleton Services** - Single instance, manages internal state
3. **Zustand Stores** - Reactive state management for React

### Service Organization

```
src/services/
├── [domain]/
│   ├── [name]Service.ts (Business logic)
│   └── [name]Store.ts (Zustand store)
```

## Stateless Service Pattern

### Structure

```typescript
/**
 * serviceName.ts
 * 
 * PURPOSE:
 * [Service purpose]
 */

class ServiceName {
  // Static methods or instance methods
  async performOperation(params: Params): Promise<Result> {
    // Implementation
  }
}

export const serviceName = new ServiceName();
```

### Example: formatters.ts

```typescript
export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...options,
  }).format(amount);
}
```

## Singleton Service Pattern

### Structure

```typescript
class ServiceName {
  private static instance: ServiceName;
  private internalState: State;
  
  static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }
  
  private constructor() {
    this.internalState = initialState;
  }
  
  async performOperation(): Promise<Result> {
    // Use this.internalState
  }
}

export const serviceName = ServiceName.getInstance();
```

### Example: errorLogger.ts

```typescript
class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: CapturedError[] = [];
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  logError(category: ErrorCategory, message: string): CapturedError {
    // Implementation
  }
}

export const errorLogger = ErrorLogger.getInstance();
```

## Zustand Store Pattern

### Structure

```typescript
import { create } from 'zustand';

interface StoreState {
  // State properties
  data: Data[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadData: () => Promise<void>;
  addData: (item: Data) => void;
  updateData: (id: string, updates: Partial<Data>) => void;
  deleteData: (id: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  data: [],
  isLoading: false,
  error: null,
  
  // Actions
  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await service.getAll();
      set({ data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  addData: (item) => {
    set((state) => ({ data: [...state.data, item] }));
  },
  
  // ... other actions
}));
```

### Best Practices

1. **Separate concerns:** Service for logic, Store for state
2. **Use selectors:** Subscribe to specific state slices
3. **Async actions:** Handle loading and error states
4. **Immutability:** Always return new state objects

## Common Patterns

### Service + Store Pattern

```typescript
// Service (business logic)
class DataService {
  async getAll(): Promise<Data[]> {
    // API call or data access
  }
  
  async create(data: Omit<Data, 'id'>): Promise<Data> {
    // Create logic
  }
}

export const dataService = new DataService();

// Store (state management)
export const useDataStore = create<DataStore>((set, get) => ({
  data: [],
  isLoading: false,
  
  loadData: async () => {
    set({ isLoading: true });
    const data = await dataService.getAll();
    set({ data, isLoading: false });
  },
  
  createData: async (newData) => {
    const created = await dataService.create(newData);
    set((state) => ({ data: [...state.data, created] }));
  },
}));
```

### Error Handling Pattern

```typescript
async performOperation(): Promise<Result> {
  try {
    // Operation
    return { success: true, data: result };
  } catch (error) {
    errorLogger.logFromError('service', error, 'error', {
      source: 'ServiceName',
      operation: 'performOperation',
    });
    return { success: false, error: (error as Error).message };
  }
}
```

### Caching Pattern

```typescript
class ServiceName {
  private cache: Map<string, CachedData> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async getData(key: string): Promise<Data> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await fetchData(key);
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

### Subscription Pattern

```typescript
class ServiceName {
  private listeners: Set<(data: Data) => void> = new Set();
  
  subscribe(listener: (data: Data) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify(data: Data): void {
    this.listeners.forEach(listener => listener(data));
  }
}
```

## Integration Patterns

### Service Integration

```typescript
// Service A uses Service B
import { serviceB } from './serviceB';

class ServiceA {
  async performOperation(): Promise<Result> {
    const data = await serviceB.getData();
    // Use data from Service B
  }
}
```

### Store Integration

```typescript
// Store A uses Store B
import { useStoreB } from './storeB';

export const useStoreA = create<StoreA>((set, get) => ({
  // Access Store B
  performAction: () => {
    const dataB = useStoreB.getState().data;
    // Use data from Store B
  },
}));
```

## Performance Considerations

1. **Lazy Loading:** Load data on demand
2. **Caching:** Cache expensive operations
3. **Debouncing:** Debounce frequent operations
4. **Batching:** Batch multiple operations
5. **Async Operations:** Don't block UI thread

## Related Documentation

- `AI_TEAM_ONBOARDING.md` - Service patterns overview
- `docs/components/COMPONENT_PATTERNS.md` - Component patterns
- `src/services/ai/aiServiceBridge.ts` - Service example

