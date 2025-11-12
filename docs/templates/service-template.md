# Service Documentation Template

Use this template when adding file-level comments to services.

```typescript
/**
 * serviceName.ts
 * 
 * PURPOSE:
 * [One sentence describing what this service does and its primary responsibility]
 * 
 * ARCHITECTURE:
 * [How the service fits into the system]
 * - [Key architectural decision 1]
 * - [Key architectural decision 2]
 * - [Key architectural decision 3]
 * 
 * CURRENT STATUS:
 * ✅ [Completed feature 1]
 * ✅ [Completed feature 2]
 * 🔄 [In progress feature]
 * 📝 [Planned feature]
 * 
 * DEPENDENCIES:
 * - [Service]: [Purpose and relationship]
 * - [Utility]: [Purpose and relationship]
 * - [Type]: [Purpose and relationship]
 * 
 * STATE MANAGEMENT:
 * - [Stateless/Singleton/Zustand pattern]
 * - [How state is managed if applicable]
 * 
 * PERFORMANCE:
 * - [Optimization 1]
 * - [Optimization 2]
 * - [Performance consideration]
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { serviceName } from '@/services/domain/serviceName';
 * 
 * // Example usage
 * const result = await serviceName.performOperation(params);
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
One clear sentence describing what the service does.

### ARCHITECTURE
How the service fits into the system, key architectural decisions, and patterns used.

### CURRENT STATUS
What's working, what's in progress, what's planned.

### DEPENDENCIES
List all key dependencies and explain their purpose.

### STATE MANAGEMENT
Describe the state management pattern (stateless, singleton, Zustand).

### PERFORMANCE
List optimizations, caching strategies, and performance considerations.

### USAGE EXAMPLE
Provide a simple, working code example showing how to use the service.

### RELATED FILES
List related files and explain their relationship.

### TODO / FUTURE ENHANCEMENTS
List planned improvements and future enhancements.

