# Component Documentation Template

Use this template when adding file-level comments to React components.

```typescript
/**
 * ComponentName.tsx
 * 
 * PURPOSE:
 * [One sentence describing what this component does and its primary responsibility]
 * 
 * ARCHITECTURE:
 * [How the component fits into the system]
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
 * - [Service/Store]: [Purpose and relationship]
 * - [Component]: [Purpose and relationship]
 * - [Utility]: [Purpose and relationship]
 * 
 * STATE MANAGEMENT:
 * - Local state: [What local state is managed]
 * - Uses Zustand: [Which stores are used]
 * - Props: [What props are accepted]
 * 
 * PERFORMANCE:
 * - [Optimization 1]
 * - [Optimization 2]
 * - [Performance consideration]
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import ComponentName from '@/components/ComponentName';
 * 
 * function ParentComponent() {
 *   return <ComponentName prop1={value1} prop2={value2} />;
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
One clear sentence describing what the component does.

### ARCHITECTURE
How the component fits into the system, key architectural decisions, and relationships.

### CURRENT STATUS
What's working, what's in progress, what's planned. Use checkmarks (✅), in-progress (🔄), or planned (📝).

### DEPENDENCIES
List all key dependencies (services, stores, components, utilities) and explain their purpose.

### STATE MANAGEMENT
Describe how state is managed (local, Zustand, props).

### PERFORMANCE
List optimizations, performance considerations, and bottlenecks.

### USAGE EXAMPLE
Provide a simple, working code example showing how to use the component.

### RELATED FILES
List related files and explain their relationship to this component.

### TODO / FUTURE ENHANCEMENTS
List planned improvements and future enhancements.

