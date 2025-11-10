# Changelog

All notable changes to DLX Studios Ultimate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-09

### Added
- **ESLint v9 Configuration**: Migrated from ESLint v8 to v9 with new flat config format
- **Test Infrastructure**: Set up Vitest and Playwright test frameworks
- **Test Results Documentation**: Created comprehensive test results report
- **Connection Status Bar**: New horizontal connection status display component
- **Error Boundaries**: Granular error boundaries for major application sections
- **Agent Pair Service**: Enhanced workflow with proper maxIterations loop implementation

### Changed
- **Site-wide Visual Cleanup**: Standardized spacing, colors, and component styling across all tabs
- **Navigation Bar**: Centered navigation bar site-wide with repositioned quick stats
- **Itor Toolbar**: Moved to right side of navigation bar
- **Model Catalog**: Made frameless while maintaining scroll functionality
- **Command Hub**: Removed padding for frameless design
- **Card Components**: Standardized padding (1.25rem), colors, and hover effects
- **Action Buttons**: Unified styling across all components

### Fixed
- Fixed `generateAndReview` maxIterations parameter to properly loop through refinement cycles
- Fixed TypeScript unused import/variable errors in LLMRevenueCommandCenter
- Fixed ESLint configuration migration issues
- Fixed center content layout when Command Hub expands
- Fixed Model Catalog width and styling

### Technical
- Migrated ESLint config from `.eslintrc.cjs` to `eslint.config.js` (v9 format)
- Added `globals` package for proper browser/Node.js global definitions
- Standardized card component styling (padding, borders, backgrounds, hover states)
- Improved responsive design consistency
- Enhanced error handling with granular boundaries

## [1.0.0] - 2025-01-08

### Added
- **LLM Optimizer Panel**: Complete LLM optimization interface with hardware profiling, model catalog, recommendations, and benchmarking
- **Crypto Lab**: Full-featured trading platform with Coinbase Advanced Trade API integration, paper trading mode, real-time market data, and 3Commas-style interface
- **Wealth Lab**: Personal financial management with net worth tracking, budgeting, retirement planning, account aggregation (Schwab, Plaid, Yodlee)
- **Idea Lab**: Three-panel planning workspace with idea inventory, planning canvas, and Kai AI agent for brainstorming
- **Vibed Ed IDE**: Complete development environment with Monaco Editor, File Explorer, AI Assistant, and Turbo Edit
- **Revenue & Monetization Dashboard**: Business revenue tracking, expense management, and P&L analysis
- **Auto-Update System**: Electron auto-updater integration with manual check option
- **Version Management**: Comprehensive version tracking system for app, components, and features
- **Error Capture System**: Advanced error logging and tracking with context capture
- **Activity Logging**: System-wide activity tracking with icon mapping and categorization

### Changed
- Migrated all AI services from Electron main process to renderer process for better performance
- Consolidated AI service architecture (removed electron/ai/ services, unified in renderer)
- Replaced Skyline Fusion navigation with LLM & Revenue Command Center as main interface
- Standardized import paths to use `@/` alias throughout codebase
- Enhanced API key encryption from Base64 to AES-GCM for proper security

### Fixed
- Fixed all TypeScript compilation errors (missing imports, type mismatches, undefined types)
- Fixed API key encryption security vulnerability (Base64 → AES-GCM)
- Fixed Idea Lab race condition in idea selection
- Fixed CSS variable inconsistencies across components
- Fixed WebContainer type issues with proper type guards
- Fixed WebGL type issues with proper type casting

### Security
- **Critical**: Upgraded API key encryption from Base64 encoding to AES-GCM encryption using Web Crypto API
- Added proper null handling for API credentials
- Enhanced error handling consistency across services

### Technical
- TypeScript strict mode compliance
- Comprehensive code cleanup and optimization
- Removed unused imports and dead code
- Standardized component structure and patterns
- Added React.memo and useCallback optimizations
- Implemented lazy loading for heavy components

---

## [Unreleased]

### Planned
- Advanced order types for Crypto Lab (Stop Loss, Take Profit, OCO, Trailing Stop)
- Virtual scrolling for long lists
- Enhanced debouncing for expensive operations
- Retirement projections calculator
- Estate planning features
- Market info bar component for Crypto Lab

