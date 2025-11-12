# Utility Documentation Template

Use this template when adding file-level comments to utility files.

```typescript
/**
 * utilityName.ts
 * 
 * PURPOSE:
 * [One sentence describing what utilities this file provides]
 * 
 * ARCHITECTURE:
 * Pure utility functions that:
 * - [Function category 1]
 * - [Function category 2]
 * - [Function category 3]
 * 
 * CURRENT STATUS:
 * ✅ [Completed utility 1]
 * ✅ [Completed utility 2]
 * 🔄 [In progress utility]
 * 📝 [Planned utility]
 * 
 * DEPENDENCIES:
 * - [Dependency 1]: [Purpose]
 * - [Dependency 2]: [Purpose]
 * 
 * STATE MANAGEMENT:
 * - Stateless utilities (no state)
 * 
 * PERFORMANCE:
 * - [Optimization 1]
 * - [Optimization 2]
 * - [Performance consideration]
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { utilityFunction } from '@/utils/utilityName';
 * 
 * const result = utilityFunction(input);
 * ```
 * 
 * RELATED FILES:
 * - [Related file 1]: [Relationship]
 * - [Related file 2]: [Relationship]
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - [Future improvement 1]
 * - [Future improvement 2]
 */
```

## Sections Explained

### PURPOSE
One clear sentence describing what utilities the file provides.

### ARCHITECTURE
How the utilities are organized and what they do.

### CURRENT STATUS
What's working, what's in progress, what's planned.

### DEPENDENCIES
List any dependencies (usually none for pure utilities).

### STATE MANAGEMENT
Always "Stateless utilities (no state)" for pure utilities.

### PERFORMANCE
List optimizations and performance considerations.

### USAGE EXAMPLE
Provide a simple code example showing how to use the utility.

### RELATED FILES
List files that use these utilities.

### TODO / FUTURE ENHANCEMENTS
List planned improvements.

