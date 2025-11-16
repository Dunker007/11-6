# Testing Guide

## Overview

This document provides instructions for setting up and running tests for DLX Studios Ultimate.

## Test Setup

### Dependencies Installed

- `@vitest/ui` - Vitest UI for visual test debugging
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - DOM matchers for assertions
- `@testing-library/user-event` - User interaction simulation

### Configuration Files

- `src/test/setup.ts` - Test setup and configuration
- `src/test/testUtils.tsx` - Custom test utilities and render helpers
- `vite.config.ts` - Includes Vitest configuration reference

## Running Tests

### Unit Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run tests with UI
npm test -- --ui
```

### E2E Tests (Playwright)

```bash
# Run end-to-end tests
npm run test:e2e

# Run in UI mode
npm run test:e2e -- --ui
```

## Writing Tests

### Component Tests

Example component test:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/testUtils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Service Tests

Example service test:

```typescript
import { describe, it, expect } from 'vitest';
import { myService } from '@/services/myService';

describe('myService', () => {
  it('should return expected result', () => {
    const result = myService.doSomething();
    expect(result).toBeDefined();
  });
});
```

## Test Utilities

### Custom Render

The `testUtils.tsx` file provides a custom render function with all providers pre-configured:

```typescript
import { render, screen } from '@/test/testUtils';

// Automatically wraps component with all providers
render(<MyComponent />);
```

### Providers Included

- Zustand store providers (if needed)
- React Router (if needed)
- Error boundaries
- Theme providers

## Test Best Practices

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test how components work together
3. **E2E Tests**: Test complete user workflows
4. **Mock External Dependencies**: Mock API calls, file system, etc.
5. **Clean Up**: Use `afterEach` cleanup for tests that modify state

## Coverage

```bash
# Run tests with coverage
npm test -- --coverage

# Generate coverage report
npm test -- --coverage --reporter=html
```

## Troubleshooting

### Issue: Tests fail with module not found

**Solution:** Ensure test files import from `@/` path aliases correctly.

### Issue: DOM matchers not working

**Solution:** Ensure `@testing-library/jest-dom/matchers` is imported in `setup.ts`.

### Issue: Vitest not found

**Solution:** Ensure `@vitest/ui` is installed: `npm install --save-dev @vitest/ui`

---

**Last Updated:** November 2025  
**Status:** ✅ Test infrastructure ready
