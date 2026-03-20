# Update Plan: Hardening & Polish

**Date:** November 19, 2025
**Objective:** Balance critical technical debt reduction ("Backfilling & Hardening") with high-impact user experience improvements ("Nav & Polish").

---

## 🛡️ Part 1: Backfilling & Hardening (50%)
*Focus: Stability, Performance, and Code Quality*

### 1. Critical Service De-duplication (High Priority)
- **Target:** Consolidate duplicate services identified in `CODE_QUALITY_REPORT.md`.
- **Actions:**
  - ✅ Merge `benchmarkService.ts` (2 files)
  - ✅ Merge `marketDataService.ts` (Crypto vs Wealth)
  - ✅ Merge `taxReportingService.ts`
- **Benefit:** Prevents data conflicts and reduces bundle size.

### 2. TypeScript Error Reduction
- **Target:** Reduce current error count (397) by 50%.
- **Actions:**
  - Fix "Implicit any" errors in Service layer.
  - Resolve type mismatches in `src/types`.
  - Add missing interfaces for API responses.
- **Benefit:** Improves stability and developer experience.

### 3. CSS Consolidation (Phase 1)
- **Target:** Execute Phase 1 of `CSS_CONSOLIDATION_PLAN.md`.
- **Actions:**
  - Consolidate Core System styles (Tokens, Themes, Animations).
  - Remove unused/dead CSS files.
- **Benefit:** Reduces bundle size and improves maintainability.

### 4. Error Boundary Implementation
- **Target:** Protect critical application paths.
- **Actions:**
  - Wrap main feature views (Editor, Dashboard, Settings) in `EnhancedErrorBoundary`.
  - Ensure graceful degradation for AI service failures.
- **Benefit:** Prevents "White Screen of Death" and improves user trust.

---

## ✨ Part 2: Navigation & Polish (50%)
*Focus: "Vibe", Flow, and Visual Excellence*

### 1. Navigation Experience Overhaul
- **Target:** Make navigation smoother and more intuitive.
- **Actions:**
  - **Sidebar Polish:** Improve active states, hover effects, and collapse animations.
  - **Breadcrumbs:** Implement dynamic breadcrumbs for deep navigation.
  - **Keyboard Shortcuts:** Add shortcuts for quick navigation between views.
- **Benefit:** Faster workflow and "premium" feel.

### 2. Visual "Vibe" Polish
- **Target:** Enhance the Cyberpunk/Glassmorphism aesthetic.
- **Actions:**
  - **Micro-animations:** Add subtle entry animations for page transitions.
  - **Glassmorphism Consistency:** Standardize backdrop-filter and border styles across cards.
  - **Interactive Elements:** Improve button hover/active states with "glow" effects.
- **Benefit:** Increases user delight and reinforces the brand identity.

### 3. Command Palette 2.0
- **Target:** Expand the recently improved Command Palette.
- **Actions:**
  - Add "Navigation" commands (Jump to file, Jump to settings).
  - Improve visual feedback for search results.
- **Benefit:** Power-user efficiency.

### 4. Theme System Refinement
- **Target:** Ensure consistent theming.
- **Actions:**
  - Verify all components use CSS variables for colors.
  - Fix any hardcoded color values.
- **Benefit:** Easier theming and consistent look.

---

## 📅 Execution Strategy

We will alternate between tasks to maintain momentum and keep the "vibe" high.

**Phase 1: Foundation & Flow (Immediate)**
1.  ✅ [Hardening] Fix Duplicate Services.
2.  [Polish] Sidebar & Navigation Polish.

**Phase 2: Stability & Sparkle**
3.  [Hardening] TypeScript Error Blitz (Top 50).
4.  [Polish] Micro-animations & Glassmorphism.

**Phase 3: Structure & Speed**
5.  [Hardening] CSS Consolidation Phase 1.
6.  [Polish] Command Palette Enhancements.

---

**Status:** Phase 1 (Hardening) Complete. Moving to Phase 1 (Polish).
