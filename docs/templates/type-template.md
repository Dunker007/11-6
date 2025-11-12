# Type Documentation Template

Use this template when adding file-level comments to type definition files.

```typescript
/**
 * typeName.ts
 * 
 * PURPOSE:
 * TypeScript type definitions for [domain]. Defines interfaces, types, and enums
 * used throughout the application for [purpose].
 * 
 * ARCHITECTURE:
 * Type system that:
 * - [Type category 1]
 * - [Type category 2]
 * - [Type category 3]
 * 
 * CURRENT STATUS:
 * ✅ [Completed type 1]
 * ✅ [Completed type 2]
 * 🔄 [In progress type]
 * 📝 [Planned type]
 * 
 * DEPENDENCIES:
 * - [Type dependency 1]: [Purpose]
 * - [Type dependency 2]: [Purpose]
 * 
 * STATE MANAGEMENT:
 * - Type definitions only (no state)
 * 
 * PERFORMANCE:
 * - Type-only file (no runtime code)
 * - Efficient type checking
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import type { TypeName, InterfaceName } from '@/types/typeName';
 * 
 * const data: TypeName = {
 *   // Example data
 * };
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
One clear sentence describing what types the file defines.

### ARCHITECTURE
How the types are organized and what they represent.

### CURRENT STATUS
What types are defined, what's planned.

### DEPENDENCIES
List any type dependencies from other type files.

### STATE MANAGEMENT
Always "Type definitions only (no state)".

### PERFORMANCE
Always "Type-only file (no runtime code)".

### USAGE EXAMPLE
Provide a simple code example showing how to use the types.

### RELATED FILES
List files that use these types.

### TODO / FUTURE ENHANCEMENTS
List planned type additions.

