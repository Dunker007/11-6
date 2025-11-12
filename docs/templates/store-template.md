# Store Documentation Template

Use this template when adding file-level comments to Zustand stores.

```typescript
/**
 * storeName.ts
 * 
 * PURPOSE:
 * [One sentence describing what this store manages]
 * 
 * ARCHITECTURE:
 * Zustand store that:
 * - [Key responsibility 1]
 * - [Key responsibility 2]
 * - [Key responsibility 3]
 * 
 * CURRENT STATUS:
 * ✅ [Completed feature 1]
 * ✅ [Completed feature 2]
 * 🔄 [In progress feature]
 * 📝 [Planned feature]
 * 
 * DEPENDENCIES:
 * - [Service]: [Purpose and relationship]
 * - [Type]: [Purpose and relationship]
 * 
 * STATE MANAGEMENT:
 * - [State property 1]: [Purpose]
 * - [State property 2]: [Purpose]
 * - [Action 1]: [Purpose]
 * - [Action 2]: [Purpose]
 * 
 * PERFORMANCE:
 * - [Optimization 1]
 * - [Optimization 2]
 * - [Performance consideration]
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { useStoreName } from '@/services/domain/storeName';
 * 
 * function Component() {
 *   const { data, loadData, isLoading } = useStoreName();
 *   
 *   useEffect(() => {
 *     loadData();
 *   }, []);
 * }
 * ```
 * 
 * RELATED FILES:
 * - [Related file 1]: [Relationship]
 * - [Related file 2]: [Relationship]
 * - [Related file 3]: [Relationship]
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - [Future improvement 1]
 * - [Future improvement 2]
 * - [Future improvement 3]
 */
```

## Sections Explained

### PURPOSE
One clear sentence describing what state the store manages.

### ARCHITECTURE
How the store fits into the system and what it wraps (services, etc.).

### CURRENT STATUS
What's working, what's in progress, what's planned.

### DEPENDENCIES
List all key dependencies (services, types).

### STATE MANAGEMENT
List all state properties and actions with their purposes.

### PERFORMANCE
List optimizations, selector patterns, and performance considerations.

### USAGE EXAMPLE
Provide a simple, working code example showing how to use the store.

### RELATED FILES
List related files and explain their relationship.

### TODO / FUTURE ENHANCEMENTS
List planned improvements and future enhancements.

