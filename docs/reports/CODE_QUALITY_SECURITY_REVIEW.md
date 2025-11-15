# Code Quality & Security Scanning - Review & Integration Options

**Date:** November 15, 2025  
**Status:** Review Complete  
**Priority:** High

## Executive Summary

The application currently has basic ESLint configuration and an AI-powered code review feature, but lacks real-time code quality feedback, automated security scanning, and comprehensive code analysis tools. This document reviews integration options and provides recommendations.

## Current State Analysis

### ✅ What's Currently Available

1. **ESLint Configuration**
   - TypeScript ESLint plugin configured
   - React Hooks rules enabled
   - Prettier integration
   - Basic rules for code quality
   - CLI-based linting (`npm run lint`)

2. **AI-Powered Code Review**
   - `CodeReview` component exists
   - AI-based analysis via `codeReviewService`
   - Security scanning capabilities
   - Issue categorization (performance, security, style, bug, complexity)
   - Severity levels (error, warning, info, suggestion)

3. **Testing Infrastructure**
   - Vitest configured
   - Test coverage support
   - Unit testing framework in place

### ❌ Critical Gaps

1. **No Real-Time Linting** - ESLint only runs via CLI
2. **No Security Vulnerability Scanning** - No npm audit, Snyk, or similar
3. **No Code Complexity Analysis** - No cyclomatic complexity metrics
4. **No Duplicate Code Detection** - No code duplication analysis
5. **No Dependency Health Monitoring** - No outdated/vulnerable dependency tracking
6. **No Pre-commit Hooks** - No automated quality checks before commit
7. **No Code Quality Metrics Dashboard** - No aggregated quality metrics

## Integration Options Analysis

### 1. Real-Time ESLint Integration ⭐⭐⭐ (Critical Priority)

**Current State:** ESLint runs only via CLI command

**Proposed Solutions:**

#### Option A: Monaco Editor ESLint Integration (Recommended)
- **Library:** `monaco-eslint` or custom integration
- **Approach:** Use ESLint's Node.js API in Electron main process
- **Features:**
  - Real-time error/warning underlines
  - Hover tooltips with rule descriptions
  - Quick fixes via code actions
  - Auto-fix on save
  - Error panel with all issues

**Implementation:**
```typescript
// Service: eslintService.ts
import { ESLint } from 'eslint';

export class ESLintService {
  private eslint: ESLint;
  
  async initialize() {
    this.eslint = new ESLint({
      useEslintrc: true,
      cwd: process.cwd(),
    });
  }
  
  async lintFile(filePath: string, content: string): Promise<LintResult[]> {
    const results = await this.eslint.lintText(content, { filePath });
    return results[0].messages.map(msg => ({
      line: msg.line,
      column: msg.column,
      severity: msg.severity,
      message: msg.message,
      ruleId: msg.ruleId,
      fix: msg.fix,
    }));
  }
  
  async fixFile(filePath: string, content: string): Promise<string> {
    const results = await this.eslint.lintText(content, { filePath });
    if (results[0].output) {
      return results[0].output;
    }
    return content;
  }
}
```

**Monaco Integration:**
```typescript
// In Monaco editor setup
import * as monaco from 'monaco-editor';

// Register markers from ESLint results
editor.deltaDecorations([], lintResults.map(result => ({
  range: new monaco.Range(result.line, 1, result.line, 1),
  options: {
    className: `eslint-${result.severity === 2 ? 'error' : 'warning'}`,
    hoverMessage: { value: result.message },
    glyphMarginClassName: `eslint-glyph-${result.severity === 2 ? 'error' : 'warning'}`,
  },
})));
```

**Estimated Effort:** 3-4 days  
**Impact:** Very High - Immediate feedback improves code quality

---

#### Option B: Language Server Protocol (LSP)
- **Library:** `vscode-languageserver` + `vscode-languageserver-textdocument`
- **Approach:** Full LSP implementation for ESLint
- **Pros:** Industry standard, extensible
- **Cons:** More complex, overkill for single tool

**Estimated Effort:** 5-7 days  
**Impact:** High but more complex than needed

---

### 2. Security Vulnerability Scanning ⭐⭐⭐ (Critical Priority)

**Current State:** No automated security scanning

**Proposed Solutions:**

#### Option A: npm audit Integration (Quick Win)
- **Built-in:** npm audit is already available
- **Features:**
  - Scan package.json dependencies
  - Identify known vulnerabilities
  - Severity levels (low, moderate, high, critical)
  - Fix recommendations
  - Auto-fix with `npm audit fix`

**Implementation:**
```typescript
// Service: securityScanService.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Vulnerability {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  fixAvailable: boolean;
}

export class SecurityScanService {
  async scanProject(projectPath: string): Promise<Vulnerability[]> {
    const { stdout } = await execAsync('npm audit --json', { cwd: projectPath });
    const audit = JSON.parse(stdout);
    
    const vulnerabilities: Vulnerability[] = [];
    for (const [name, vuln] of Object.entries(audit.vulnerabilities || {})) {
      vulnerabilities.push({
        name,
        severity: vuln.severity,
        title: vuln.title,
        description: vuln.overview || '',
        recommendation: vuln.recommendation || '',
        fixAvailable: vuln.fixAvailable || false,
      });
    }
    return vulnerabilities;
  }
  
  async fixVulnerabilities(projectPath: string): Promise<{ fixed: number; errors: string[] }> {
    try {
      await execAsync('npm audit fix', { cwd: projectPath });
      // Re-scan to get count
      const after = await this.scanProject(projectPath);
      return { fixed: 0, errors: [] }; // Calculate from before/after
    } catch (error) {
      return { fixed: 0, errors: [(error as Error).message] };
    }
  }
}
```

**Estimated Effort:** 2-3 days  
**Impact:** Very High - Critical for security

---

#### Option B: Snyk Integration (Enterprise)
- **Library:** `@snyk/snyk-npm-plugin` or Snyk API
- **Features:**
  - More comprehensive than npm audit
  - License compliance checking
  - Container scanning
  - CI/CD integration
  - Requires API key (free tier available)

**Implementation:**
```typescript
import * as snyk from '@snyk/snyk-npm-plugin';

export class SnykSecurityService {
  async scanProject(projectPath: string, apiKey: string): Promise<SnykResults> {
    await snyk.test(projectPath, {
      apiKey,
      json: true,
    });
  }
}
```

**Estimated Effort:** 3-4 days  
**Impact:** High - More comprehensive but requires setup

---

#### Option C: OWASP Dependency-Check
- **Tool:** OWASP Dependency-Check CLI
- **Features:**
  - Comprehensive vulnerability database
  - CVE matching
  - License analysis
  - Requires Java runtime

**Estimated Effort:** 4-5 days  
**Impact:** High but requires Java dependency

**Recommendation:** Start with npm audit (Option A), add Snyk later if needed

---

### 3. Code Complexity Analysis ⭐⭐ (High Priority)

**Current State:** No complexity metrics

**Proposed Solutions:**

#### Option A: ESLint Complexity Rules
- **Built-in:** ESLint has complexity rules
- **Rules:**
  - `complexity` - Cyclomatic complexity
  - `max-depth` - Nesting depth
  - `max-lines` - Function length
  - `max-lines-per-function` - Function line count
  - `max-params` - Parameter count

**Implementation:**
```javascript
// Add to eslint.config.js
rules: {
  'complexity': ['warn', 10],
  'max-depth': ['warn', 4],
  'max-lines-per-function': ['warn', 100],
  'max-params': ['warn', 5],
}
```

**Estimated Effort:** 1 day  
**Impact:** Medium-High - Quick win

---

#### Option B: Complexity Analysis Service
- **Library:** `es6-plato` or `complexity-report`
- **Features:**
  - Detailed complexity metrics
  - Maintainability index
  - Visual reports
  - Historical tracking

**Implementation:**
```typescript
import { analyze } from 'es6-plato';

export class ComplexityService {
  async analyzeProject(projectPath: string): Promise<ComplexityReport> {
    const report = await analyze([`${projectPath}/**/*.{ts,tsx}`], {
      complexity: {
        max: 10,
      },
    });
    return report;
  }
}
```

**Estimated Effort:** 2-3 days  
**Impact:** Medium - Nice to have metrics

**Recommendation:** Start with ESLint rules (Option A)

---

### 4. Duplicate Code Detection ⭐ (Medium Priority)

**Proposed Solutions:**

#### Option A: jscpd (JavaScript Copy/Paste Detector)
- **Library:** `jscpd`
- **Features:**
  - Detects code duplication
  - Configurable threshold
  - Multiple language support
  - HTML/JSON reports

**Implementation:**
```typescript
import { jscpd } from 'jscpd';

export class DuplicateCodeService {
  async detectDuplicates(projectPath: string): Promise<Duplicate[]> {
    const result = await jscpd.detect({
      path: projectPath,
      minLines: 5,
      minTokens: 50,
    });
    return result.duplicates;
  }
}
```

**Estimated Effort:** 2 days  
**Impact:** Medium - Helps maintain DRY principle

---

### 5. Dependency Health Monitoring ⭐⭐ (High Priority)

**Proposed Solutions:**

#### Option A: npm-check-updates Integration
- **Library:** `npm-check-updates`
- **Features:**
  - Check for outdated packages
  - Update package.json
  - Interactive updates
  - Major/minor/patch filtering

**Implementation:**
```typescript
import ncu from 'npm-check-updates';

export class DependencyHealthService {
  async checkOutdated(projectPath: string): Promise<OutdatedPackage[]> {
    const upgrades = await ncu({
      cwd: projectPath,
      jsonUpgraded: true,
    });
    return Object.entries(upgrades).map(([name, version]) => ({
      name,
      current: getCurrentVersion(name),
      latest: version,
    }));
  }
}
```

**Estimated Effort:** 2 days  
**Impact:** High - Keep dependencies up to date

---

### 6. Pre-commit Hooks ⭐⭐ (High Priority)

**Proposed Solutions:**

#### Option A: Husky + lint-staged
- **Libraries:** `husky`, `lint-staged`
- **Features:**
  - Run linting before commit
  - Run tests before commit
  - Auto-fix issues
  - Prevent bad commits

**Implementation:**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

```typescript
// Setup husky
import { install } from 'husky';

install();

// .husky/pre-commit
npx lint-staged
```

**Estimated Effort:** 1-2 days  
**Impact:** High - Prevents bad code from being committed

---

### 7. Code Quality Metrics Dashboard ⭐ (Medium Priority)

**Proposed Solution:**

Create a comprehensive dashboard showing:
- ESLint error/warning counts
- Security vulnerability count
- Code complexity metrics
- Test coverage percentage
- Duplicate code percentage
- Dependency health score

**Implementation:**
- Aggregate data from all services
- Visual charts and graphs
- Historical trends
- Export reports

**Estimated Effort:** 3-4 days  
**Impact:** Medium - Good for tracking improvements

---

## Implementation Priority Matrix

| Feature | Priority | Effort | Impact | ROI | Phase |
|---------|----------|--------|--------|-----|-------|
| Real-Time ESLint | ⭐⭐⭐ | 3-4 days | Very High | Very High | Phase 1 |
| npm audit Integration | ⭐⭐⭐ | 2-3 days | Very High | Very High | Phase 1 |
| Pre-commit Hooks | ⭐⭐ | 1-2 days | High | Very High | Phase 1 |
| Dependency Health | ⭐⭐ | 2 days | High | High | Phase 2 |
| Complexity Analysis | ⭐⭐ | 1 day | Medium-High | High | Phase 2 |
| Duplicate Detection | ⭐ | 2 days | Medium | Medium | Phase 3 |
| Quality Dashboard | ⭐ | 3-4 days | Medium | Medium | Phase 3 |

## Recommended Implementation Plan

### Phase 1: Critical Quality & Security (1-2 weeks)
1. **Real-Time ESLint Integration** - Immediate feedback
2. **npm audit Integration** - Security scanning
3. **Pre-commit Hooks** - Prevent bad commits

### Phase 2: Enhanced Analysis (1 week)
4. **Dependency Health Monitoring** - Keep dependencies updated
5. **Complexity Analysis** - ESLint rules + metrics

### Phase 3: Advanced Features (1-2 weeks)
6. **Duplicate Code Detection** - Maintain DRY
7. **Quality Dashboard** - Track metrics over time

## Technical Considerations

### Architecture
- Create `codeQualityService.ts` for aggregating all quality checks
- Create `securityScanService.ts` for security scanning
- Integrate with existing `CodeReview` component
- Add quality indicators to file explorer
- Real-time updates via file watchers

### Performance
- Debounce linting on file changes
- Cache lint results
- Background scanning for large projects
- Progressive loading of results

### User Experience
- Non-intrusive error indicators
- Quick fix suggestions
- Auto-fix on save option
- Quality score badges
- Filterable issue lists

## Dependencies to Add

```json
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^15.0.0",
    "npm-check-updates": "^16.10.0"
  },
  "dependencies": {
    "jscpd": "^3.5.0",
    "es6-plato": "^1.1.0"
  }
}
```

## Success Metrics

- **Error Reduction:** % decrease in ESLint errors over time
- **Security:** Number of vulnerabilities fixed
- **Code Quality:** Improvement in complexity scores
- **Developer Satisfaction:** Feedback on real-time feedback
- **Time Saved:** Reduction in manual code review time

## Next Steps

1. ✅ Review complete
2. ⏭️ Get approval for Phase 1 features
3. ⏭️ Implement real-time ESLint integration
4. ⏭️ Add npm audit scanning
5. ⏭️ Set up pre-commit hooks

---

**Reviewer:** AI Assistant  
**Date:** November 15, 2025  
**Status:** Ready for Implementation Planning

