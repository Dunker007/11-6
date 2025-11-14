# TypeScript Errors (173 total)

## Category 1: Missing Properties (Est. 40 errors)

### AssetType Missing Properties (4 errors)
- `src/components/LLMOptimizer/WealthLab/components/AssetList.tsx(16,11)`: Missing nft, private_investment, commodity, derivative
- `src/services/wealth/portfolioService.ts(60,7)`: Missing nft, private_investment, commodity, derivative
- `src/services/wealth/portfolioService.ts(206,5)`: Missing nft, private_investment, commodity, derivative
- `src/services/wealth/portfolioService.ts(308,7)`: Missing nft, private_investment, commodity, derivative

### PlanStep Missing Properties (14 errors)
- `src/core/ai/aiServiceBridge.ts(172,11)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(176,11)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(181,11)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(193,11)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(197,11)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(201,11)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(212,9)`: Missing id, status
- `src/core/ai/aiServiceBridge.ts(216,9)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(295,11)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(299,11)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(304,11)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(316,11)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(320,11)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(324,11)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(335,9)`: Missing id, status
- `src/services/ai/aiServiceBridge.ts(339,9)`: Missing id, status

### ModelCatalogEntry Missing Properties (1 error)
- `src/components/LLMOptimizer/ModelStatusDashboard.tsx(136,38)`: Missing bestFor, strengths, limitations

### SystemStats Missing Properties (3 errors)
- `src/components/LLMOptimizer/ModelDetailModal.tsx(137,49)`: Property 'totalGB' does not exist
- `src/components/LLMOptimizer/ModelDetailModal.tsx(138,24)`: Property 'totalGB' does not exist
- `src/components/LLMOptimizer/ModelDetailModal.tsx(139,89)`: Property 'totalGB' does not exist

### Plan Missing Properties (2 errors)
- `src/components/Workflows/PlanExecutionHost.tsx(323,20)`: Property 'description' does not exist
- `src/components/Workflows/PlanExecutionHost.tsx(325,24)`: Property 'description' does not exist

### WindowsService Missing Properties (1 error)
- `src/services/windows/serviceManager.ts(169,9)`: Property 'DisplayName' is missing

## Category 2: Type Mismatches (Est. 45 errors)

### Toast Type Issues (19 errors)
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx(54,11)`: description does not exist
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx(61,11)`: description does not exist
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx(68,9)`: description does not exist
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx(84,11)`: description does not exist
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx(91,11)`: description does not exist
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx(98,9)`: description does not exist
- `src/components/LLMOptimizer/SystemAlertsCompact.tsx(34,11)`: description does not exist
- `src/components/LLMOptimizer/SystemAlertsCompact.tsx(42,11)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(45,9)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(62,11)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(68,11)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(74,11)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(81,9)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(93,9)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(103,7)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(112,9)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(123,9)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(138,11)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(149,11)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(156,9)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(199,7)`: description does not exist
- `src/components/Workflows/BoltExport.tsx(208,7)`: description does not exist

### String | undefined Issues (1 error)
- `src/components/LLMOptimizer/ModelCatalog.tsx(170,35)`: string | undefined to string

### LLMUseCase Type Issues (3 errors)
- `src/services/ai/llmOptimizerService.ts(36,27)`: "reasoning" not assignable
- `src/services/ai/llmOptimizerService.ts(56,27)`: "reasoning" not assignable
- `src/services/ai/llmOptimizerService.ts(219,64)`: "reasoning" not assignable

### ErrorCategory Type Issues (4 errors)
- `src/services/ai/semanticIndexService.ts(69,32)`: "semantic-index" not assignable
- `src/services/ai/semanticIndexService.ts(181,32)`: "semantic-index" not assignable
- `src/services/ai/semanticIndexService.ts(359,32)`: "semantic-search" not assignable
- `src/services/workflow/planExecutionService.ts(131,32)`: unknown not assignable

### Date Type Issues (1 error)
- `src/services/wealth/importService.ts(200,11)`: Date | null to Date

### BudgetCategory Type Issues (2 errors)
- `src/services/wealth/importService.ts(201,11)`: string to BudgetCategory
- `src/services/wealth/importService.ts(443,9)`: string to BudgetCategory

### Blockchain Type Issues (3 errors)
- `src/services/wealth/nftService.ts(260,81)`: "other" not assignable
- `src/services/wealth/nftService.ts(266,81)`: "other" not assignable
- `src/services/wealth/nftService.ts(299,7)`: "other" not assignable

### Possibly Undefined Issues (2 errors)
- `src/services/wealth/portfolioAnalyticsService.ts(347,32)`: trackingError possibly undefined
- `src/services/wealth/portfolioAnalyticsService.ts(347,67)`: trackingError possibly undefined

### CodeVibe Type Issues (1 error)
- `src/services/agents/proactiveAgentService.ts(187,7)`: VibeType | undefined to VibeType

### Other Type Issues (9 errors)
- `src/services/agents/proactiveAgentService.ts(66,29)`: Property 'addInsight' does not exist
- `src/services/ai/semanticIndexService.ts(92,13)`: Property 'path' does not exist on Project
- `src/services/ai/semanticIndexService.ts(269,28)`: Property 'isFile' does not exist on FileSystemEntry
- `src/services/wealth/newsService.ts(93,68)`: Expected 1 arguments, but got 2
- `src/services/wealth/newsService.ts(98,34)`: Property 'toLowerCase' does not exist on StructuredIdea
- `src/services/wealth/newsService.ts(218,71)`: Expected 1 arguments, but got 2
- `src/services/wealth/newsService.ts(224,33)`: Property 'split' does not exist on StructuredIdea
- `src/services/windows/windowsOptimizer.ts(253,23)`: Conversion of undefined to WindowsOptimization
- `src/services/windows/windowsOptimizer.ts(341,23)`: Conversion of undefined to WindowsOptimization

## Category 3: LanceDB Schema (Est. 12 errors)

### LanceDB API Issues (12 errors)
- `src/services/ai/semanticIndexService.ts(93,17)`: Property 'vector' does not exist
- `src/services/ai/semanticIndexService.ts(93,28)`: Property 'float32' does not exist
- `src/services/ai/semanticIndexService.ts(94,24)`: Property 'utf8' does not exist
- `src/services/ai/semanticIndexService.ts(95,22)`: Property 'utf8' does not exist
- `src/services/ai/semanticIndexService.ts(96,25)`: Property 'int32' does not exist
- `src/services/ai/semanticIndexService.ts(97,23)`: Property 'int32' does not exist
- `src/services/ai/semanticIndexService.ts(98,24)`: Property 'vector' does not exist
- `src/services/ai/semanticIndexService.ts(98,35)`: Property 'float32' does not exist
- `src/services/ai/semanticIndexService.ts(99,23)`: Property 'utf8' does not exist
- `src/services/ai/semanticIndexService.ts(100,28)`: Property 'utf8' does not exist
- `src/services/ai/semanticIndexService.ts(101,25)`: Property 'utf8' does not exist

## Category 4: Unused Variables (Est. 60 errors)

### TS6133: Declared but never read (48 errors)
- `src/components/shared/LoadingState.tsx(1,16)`: ReactNode
- `src/components/VibeEditor/LargeFilesModal.tsx(2,33)`: Download
- `src/components/VibeEditor/LargeFilesModal.tsx(3,1)`: TechIcon
- `src/components/Workflows/BoltExport.tsx(16,68)`: ExternalLink
- `src/components/Workflows/PlanExecutionHost.tsx(75,44)`: useMemo
- `src/core/ai/aiServiceBridge.ts(172,11)`: [part of missing properties]
- `src/core/project/projectService.ts(24,11)`: useFileSystem
- `src/services/agents/proactiveAgentService.ts(93,47)`: filePath
- `src/services/agents/proactiveAgentService.ts(128,50)`: filePath
- `src/services/ai/embeddingService.ts(6,10)`: pipeline
- `src/services/ai/embeddingService.ts(77,11)`: pipeline
- `src/services/ai/geminiFunctions.ts(8,1)`: fileSystemService
- `src/services/ai/geminiFunctions.ts(143,17)`: code
- `src/services/ai/geminiFunctions.ts(203,24)`: maxResults
- `src/services/ai/semanticIndexService.ts(92,13)`: schema
- `src/services/project/projectService.ts(24,11)`: useFileSystem
- `src/services/wealth/accountAggregationService.ts(425,36)`: connectionId
- `src/services/wealth/accountAggregationService.ts(528,17)`: storeCredentials
- `src/services/wealth/exportService.ts(383,19)`: sheetName
- `src/services/wealth/exportService.ts(482,30)`: budget
- `src/services/wealth/exportService.ts(562,39)`: assets
- `src/services/wealth/exportService.ts(562,71)`: history
- `src/services/wealth/importService.ts(13,1)`: transactionImportService
- `src/services/wealth/importService.ts(304,43)`: file
- `src/services/wealth/marketDataService.ts(393,15)`: timestamps
- `src/services/wealth/marketDataService.ts(468,25)`: symbol
- `src/services/wealth/marketDataService.ts(468,41)`: expirationDate
- `src/services/wealth/newsService.ts(11,7)`: NEWS_KEY
- `src/services/wealth/newsService.ts(85,26)`: articleId
- `src/services/wealth/portfolioAnalyticsService.ts(118,11)`: startDate
- `src/services/wealth/portfolioAnalyticsService.ts(232,41)`: period
- `src/services/wealth/portfolioAnalyticsService.ts(262,11)`: totalReturn
- `src/services/wealth/portfolioAnalyticsService.ts(429,31)`: positions (multiple)
- `src/services/wealth/portfolioAnalyticsService.ts(429,54)`: period
- `src/services/wealth/portfolioAnalyticsService.ts(435,33)`: positions
- `src/services/wealth/portfolioAnalyticsService.ts(435,56)`: annualizedReturn
- `src/services/wealth/portfolioAnalyticsService.ts(441,32)`: positions
- `src/services/wealth/portfolioAnalyticsService.ts(441,55)`: period
- `src/services/wealth/portfolioAnalyticsService.ts(447,24)`: positions
- `src/services/wealth/portfolioAnalyticsService.ts(447,47)`: confidence
- `src/services/wealth/portfolioAnalyticsService.ts(453,44)`: positions
- `src/services/wealth/portfolioAnalyticsService.ts(453,67)`: startDate
- `src/services/wealth/portfolioService.ts(252,47)`: period
- `src/services/wealth/portfolioService.ts(357,5)`: targetAllocation
- `src/services/wealth/priceUpdateService.ts(12,1)`: Asset
- `src/services/wealth/priceUpdateService.ts(42,11)`: isActive
- `src/services/wealth/transactionImportService.ts(112,49)`: startDate
- `src/services/wealth/transactionImportService.ts(112,67)`: endDate
- `src/services/wealth/transactionImportService.ts(473,26)`: key
- `src/services/workflow/planExecutionService.ts(8,1)`: fileSystemService
- `src/services/workflow/planExecutionService.ts(9,1)`: useProjectStore
- `src/services/workflow/planExecutionService.ts(10,1)`: eventBus
- `src/studio/ConsolePanel.tsx(20,77)`: onClear
- `src/studio/Editor.tsx(14,10)`: isEditorReady

### TS6196: Declared but never used (7 errors)
- `src/services/benchmark/benchmarkStore.ts(3,31)`: BenchmarkResult
- `src/services/bolt/boltAPIService.ts(6,33)`: PackageValidationResult
- `src/services/wealth/importService.ts(14,35)`: Account
- `src/services/wealth/portfolioAnalyticsService.ts(14,15)`: Asset
- `src/services/wealth/taxReportingService.ts(10,15)`: Asset
- `src/services/wealth/taxReportingService.ts(10,30)`: Position
- `src/services/workflow/planExecutionService.ts(7,31)`: PlanStepStatus
- `src/services/workflow/planExecutionService.ts(7,47)`: PlanStatus

### TS6198: All destructured elements unused (1 error)
- `src/services/ai/geminiFunctions.ts(172,15)`: All destructured elements

## Category 5: Complex Issues (Est. 16 errors)

### Embedding Service Circular Reference (2 errors)
- `src/services/ai/embeddingService.ts(33,15)`: 'pipeline' implicitly has type 'any'
- `src/services/ai/embeddingService.ts(33,32)`: Block-scoped variable 'pipeline' used before declaration

### Monaco Editor Issues (2 errors)
- `src/components/VibeEditor/VibeEditor.tsx(731,19)`: 'breadcrumb' does not exist in options
- `src/studio/Editor.tsx(194,15)`: Type 'true' not assignable to ShowLightbulbIconMode

### ConsolePanel Issues (2 errors)
- `src/studio/ConsolePanel.tsx(154,17)`: Cannot find name 'handleClear'
- `src/studio/ConsolePanel.tsx(214,30)`: Cannot find name 'handleClear'

### ProjectService Type Conflict (1 error)
- `src/studio/Studio.tsx(84,56)`: ProjectService types have separate declarations

### NewsService StructuredIdea Issues (3 errors)
- `src/services/wealth/newsService.ts(98,34)`: toLowerCase does not exist
- `src/services/wealth/newsService.ts(224,33)`: split does not exist
- `src/services/wealth/newsService.ts(224,52)`: Parameter 'line' implicitly has 'any'
- `src/services/wealth/newsService.ts(225,21)`: Parameter 'line' implicitly has 'any'

---

## Priority by File Criticality

### P0 (Critical - AI Services, Stores, Error Handling): 28 errors
- `src/core/ai/aiServiceBridge.ts`: 8 errors (PlanStep missing properties)
- `src/services/ai/aiServiceBridge.ts`: 8 errors (PlanStep missing properties)
- `src/services/ai/semanticIndexService.ts`: 15 errors (LanceDB API, ErrorCategory)
- `src/services/ai/embeddingService.ts`: 4 errors (circular pipeline reference)
- `src/services/ai/llmOptimizerService.ts`: 3 errors (LLMUseCase type)
- `src/services/workflow/planExecutionService.ts`: 4 errors (unused imports, ErrorCategory)

### P1 (High - Core Components, Services): 60 errors
- `src/components/LLMOptimizer/ModelCatalog.tsx`: 1 error
- `src/components/LLMOptimizer/ModelDetailModal.tsx`: 3 errors
- `src/components/LLMOptimizer/ModelStatusDashboard.tsx`: 1 error
- `src/components/LLMOptimizer/OSOptimizationsPanel.tsx`: 6 errors
- `src/components/LLMOptimizer/SystemAlertsCompact.tsx`: 2 errors
- `src/components/Workflows/BoltExport.tsx`: 16 errors
- `src/components/Workflows/PlanExecutionHost.tsx`: 3 errors
- `src/services/wealth/portfolioService.ts`: 6 errors
- `src/services/wealth/importService.ts`: 5 errors
- `src/services/agents/proactiveAgentService.ts`: 4 errors
- `src/services/windows/serviceManager.ts`: 1 error
- `src/services/windows/windowsOptimizer.ts`: 2 errors
- `src/studio/ConsolePanel.tsx`: 3 errors
- `src/studio/Editor.tsx`: 2 errors
- `src/studio/Studio.tsx`: 1 error

### P2 (Medium - Feature Components): 70 errors
- `src/services/wealth/*`: ~50 errors (various unused variables, type issues)
- `src/components/VibeEditor/*`: 3 errors
- `src/components/shared/LoadingState.tsx`: 1 error
- Other wealth-related services: ~16 errors

### P3 (Low - Experimental/Stub Features): 15 errors
- `src/services/benchmark/benchmarkStore.ts`: 1 error
- `src/services/bolt/boltAPIService.ts`: 1 error
- Various unused type imports: ~13 errors

---

## Quick Wins (Can fix in Day 3)

1. **Unused variables/imports** (~60 errors): Remove or prefix with underscore
2. **Missing AssetType properties** (4 errors): Add nft, private_investment, commodity, derivative to allocation objects
3. **Toast description issues** (19 errors): Remove description property or update Toast type
4. **Monaco breadcrumb option** (1 error): Remove unsupported option

## Medium Complexity (Day 4-5)

1. **PlanStep missing properties** (14 errors): Add id and status to all PlanStep objects
2. **ErrorCategory type issues** (4 errors): Add new categories to ErrorCategory type or fix usage
3. **LLMUseCase type issues** (3 errors): Add "reasoning" to LLMUseCase type or use different value
4. **String | undefined issues** (1 error): Add type guards

## High Complexity (Create tickets)

1. **LanceDB schema issues** (12 errors): Update to new LanceDB API or check documentation
2. **Embedding service circular reference** (2 errors): Refactor pipeline initialization
3. **ProjectService type conflict** (1 error): Consolidate or resolve duplicate services
4. **StructuredIdea type issues** (3 errors): Fix type definition or casting
5. **ConsolePanel handleClear** (2 errors): Implement missing function or fix logic

---

## Summary

- **Total Errors**: 173
- **Quick Wins (Category 1 + Category 4)**: ~100 errors
- **Medium Complexity**: ~50 errors
- **High Complexity**: ~23 errors

**Target for Day 3**: Reduce from 173 to <100 (focus on unused variables and missing AssetType properties)
**Target for Day 4**: Reduce from <100 to <70 (focus on type mismatches, PlanStep properties)
**Target for Day 5**: Reduce from <70 to <50 (focus on remaining type issues, create tickets for complex ones)

