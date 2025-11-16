# Documentation Index

Welcome to the DLX Studios Ultimate documentation. This directory contains comprehensive guides, patterns, templates, and examples to help AI assistants and developers understand and contribute to the codebase.

## Quick Start

**New to the project?** Start here:
1. [`../AI_TEAM_ONBOARDING.md`](../AI_TEAM_ONBOARDING.md) - Main onboarding guide
2. [`../CURRENT_SPRINT.md`](../CURRENT_SPRINT.md) - Current priorities
3. [`../ARCHITECTURE_DECISIONS.md`](../ARCHITECTURE_DECISIONS.md) - Key architectural decisions

## Domain Guides

### AI Services
- [`ai/AI_SERVICES_GUIDE.md`](./ai/AI_SERVICES_GUIDE.md) - Complete AI services guide

### WealthLab
- [`wealth/WEALTH_LAB_GUIDE.md`](./wealth/WEALTH_LAB_GUIDE.md) - WealthLab architecture and usage

### Components
- [`components/COMPONENT_PATTERNS.md`](./components/COMPONENT_PATTERNS.md) - React component patterns

### Services
- [`services/SERVICE_PATTERNS.md`](./services/SERVICE_PATTERNS.md) - Service architecture patterns

## Pattern Guides

- [`patterns/COMMON_PATTERNS.md`](./patterns/COMMON_PATTERNS.md) - Common code patterns and examples

## Templates

Use these templates when adding file-level comments:

- [`templates/component-template.md`](./templates/component-template.md) - React component template
- [`templates/service-template.md`](./templates/service-template.md) - Service template
- [`templates/store-template.md`](./templates/store-template.md) - Zustand store template
- [`templates/utility-template.md`](./templates/utility-template.md) - Utility function template
- [`templates/type-template.md`](./templates/type-template.md) - Type definition template

## Examples

- [`examples/CODE_EXAMPLES.md`](./examples/CODE_EXAMPLES.md) - Real code examples from the codebase

## Documentation Status

### Completed (30 files documented)

**Core Documentation:**
- ✅ AI_TEAM_ONBOARDING.md
- ✅ CURRENT_SPRINT.md
- ✅ ARCHITECTURE_DECISIONS.md

**AI Services (8 files):**
- ✅ aiServiceBridge.ts
- ✅ router.ts
- ✅ llmStore.ts
- ✅ multiFileContextService.ts
- ✅ projectKnowledgeService.ts
- ✅ refactoringEngine.ts
- ✅ providers/localLLM.ts
- ✅ providers/cloudLLM.ts

**Core Stores (5 files):**
- ✅ projectStore.ts
- ✅ llmOptimizerStore.ts
- ✅ wealthStore.ts
- ✅ activityStore.ts
- ✅ errorLogger.ts

**Critical Components (10 files):**
- ✅ AIAssistant.tsx
- ✅ LLMOptimizerPanel.tsx
- ✅ VibeEditor.tsx
- ✅ FileExplorer.tsx
- ✅ AnalyticsDashboard.tsx
- ✅ ModelCatalog.tsx
- ✅ PlanExecutionHost.tsx
- ✅ EdAvatar.tsx
- ✅ ItorToolbar.tsx
- ✅ App.tsx

**Utility Files (5 files):**
- ✅ formatters.ts
- ✅ llmConfig.ts
- ✅ types/llm.ts
- ✅ types/plan.ts
- ✅ types/optimizer.ts

**Electron Main Process (2 files):**
- ✅ electron/main.ts
- ✅ electron/preload.ts

**Domain Guides (4 guides):**
- ✅ AI_SERVICES_GUIDE.md
- ✅ WEALTH_LAB_GUIDE.md
- ✅ COMPONENT_PATTERNS.md
- ✅ SERVICE_PATTERNS.md

**Templates (5 templates):**
- ✅ component-template.md
- ✅ service-template.md
- ✅ store-template.md
- ✅ utility-template.md
- ✅ type-template.md

**Examples:**
- ✅ CODE_EXAMPLES.md

## How to Use This Documentation

### For AI Assistants

1. **Start with onboarding:** Read `AI_TEAM_ONBOARDING.md`
2. **Understand architecture:** Read `ARCHITECTURE_DECISIONS.md`
3. **Check current work:** Read `CURRENT_SPRINT.md`
4. **Find patterns:** Browse domain guides and pattern guides
5. **Use templates:** When adding new files, use templates for consistency

### For Developers

1. **Quick reference:** Use `COMMON_PATTERNS.md` for common patterns
2. **Domain-specific:** Use domain guides (AI, Wealth, Components, Services)
3. **Examples:** Check `CODE_EXAMPLES.md` for real code examples
4. **Templates:** Use templates when documenting new files

## Contributing Documentation

When adding documentation:

1. **Use templates:** Follow templates in `docs/templates/`
2. **Be consistent:** Follow existing documentation style
3. **Update index:** Update this README if adding new guides
4. **Cross-reference:** Link to related files and documentation

## Documentation Standards

- **File-level comments:** Use templates for consistency
- **Code examples:** Include working examples
- **Cross-references:** Link to related files
- **Current status:** Document what's working and what's planned
- **Architecture:** Explain "why" not just "what"

## Related Documentation

- [`../.cursorrules`](../.cursorrules) - Architecture rules
- [`../AI_SERVICES_CONSOLIDATION.md`](../AI_SERVICES_CONSOLIDATION.md) - AI architecture details
- [`../QUICK_REFERENCE.md`](../QUICK_REFERENCE.md) - Quick usage reference
- [Project Review Detailed Analysis](reports/PROJECT_REVIEW_DETAILED_ANALYSIS_V2.md)
- [Project Review Recommendations](reports/PROJECT_REVIEW_RECOMMENDATIONS_V2.md)
- [Project Review Risk Assessment](reports/PROJECT_REVIEW_RISK_ASSESSMENT.md)
- [Gemini Expert Review](reports/GEMINI_EXPERT_REVIEW.md)
- [Gemini Quick Start Guide](reports/GEMINI_QUICK_START.md)

---

*Last Updated: January 2025*

