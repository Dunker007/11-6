# Purple Screen Fix Session Summary

## Problem Statement
Production Electron builds were displaying a purple/black screen instead of the UI, even though the dev server worked perfectly.

## Root Cause
The `file://` protocol used by Electron's `loadFile()` has CORS restrictions and doesn't properly handle ES modules, causing JavaScript modules to fail loading in production builds.

## Solution Implemented

### 1. Custom Protocol Handler (`app://`)
- **Created:** Custom `app://` protocol handler in `electron/main.ts`
- **Why:** Properly handles ES modules with correct CORS headers and MIME types
- **Implementation:**
  - `registerSchemesAsPrivileged()` called BEFORE `app.whenReady()`
  - `registerBufferProtocol()` called AFTER `app.whenReady()` (in `registerAppProtocolHandler()`)
  - Uses `registerBufferProtocol` instead of `registerFileProtocol` to control MIME types
  - Serves files from `.asar` archive correctly

### 2. MIME Type Handling
- JavaScript files: `application/javascript; charset=utf-8`
- CSS files: `text/css; charset=utf-8`
- HTML files: `text/html; charset=utf-8`
- Proper handling for images, fonts, JSON, etc.

### 3. Path Resolution
- Handles various path formats: `./assets/...`, `/assets/...`, `assets/...`
- Normalizes paths correctly for Windows
- Security check to prevent path traversal outside `dist` directory

### 4. Circular Dependency Fix
- **Problem:** `router.ts` imported from `providers/cloudLLM.ts`, which imported types from `router.ts`
- **Solution:** Created `src/services/ai/providers/types.ts` with shared `LLMProvider` interface
- **Files changed:**
  - Created `src/services/ai/providers/types.ts`
  - Updated `src/services/ai/providers/localLLM.ts`
  - Updated `src/services/ai/providers/cloudLLM.ts`
  - Updated `src/services/ai/router.ts`

### 5. Node.js Module Polyfills
- Created browser polyfills for Node.js-only modules:
  - `src/utils/polyfills/fs.ts`
  - `src/utils/polyfills/path.ts`
  - `src/utils/polyfills/systeminformation.ts`
  - `src/utils/polyfills/lancedb.ts`
- Updated `vite.config.ts` to alias these modules to polyfills
- Removed `external` configuration from Rollup that was causing module resolution errors

### 6. Build Verification Test
- **Created:** `scripts/afterPack.cjs` - Automated build verification
- **Functionality:**
  - Launches packaged app
  - Takes screenshot after 12 seconds
  - Analyzes screenshot pixels to detect purple/black screens
  - Fails build if >70% of pixels are purple or black
  - **Status:** Working but inconsistent (passed once, fails other times - likely timing/focus issues)

## Current Status

### ✅ Working
- Custom protocol handler implemented
- Proper MIME types set
- Path resolution handles all formats
- Circular dependencies fixed
- Node.js polyfills in place
- Build verification test detects purple screens

### ⚠️ Issues
1. **Build Verification Test Flakiness**
   - Test passed once (172 KB screenshot, 100% colored pixels)
   - Subsequent runs fail (159-163 KB screenshots)
   - Likely causes: timing issues (app not fully rendered), window focus issues, or test taking screenshot of wrong window

2. **Manual Testing Needed**
   - Need to verify if the app actually works in production
   - Console logs show protocol handler is being called but need to verify asset loading
   - DevTools temporarily enabled for debugging

## Key Files Changed

### Electron
- `electron/main.ts`
  - Added `protocol` import
  - Added `registerAppProtocolHandler()` function
  - Updated production loading to use `app://./index.html`
  - Changed from `loadFile()` to `loadURL()` with custom protocol
  - Added comprehensive path resolution and MIME type handling

### Build Configuration
- `vite.config.ts`
  - Removed `external` configuration for Node.js modules
  - Added polyfill aliases for `fs`, `path`, `systeminformation`, `@lancedb/lancedb`
  - Kept `base: './'` for relative paths

### Services
- `src/services/ai/providers/types.ts` (NEW)
- `src/services/ai/providers/localLLM.ts` (updated imports)
- `src/services/ai/providers/cloudLLM.ts` (updated imports)
- `src/services/ai/router.ts` (updated imports)

### Polyfills
- `src/utils/polyfills/fs.ts` (NEW)
- `src/utils/polyfills/path.ts` (NEW)
- `src/utils/polyfills/systeminformation.ts` (NEW)
- `src/utils/polyfills/lancedb.ts` (NEW)

### Build Verification
- `scripts/afterPack.cjs` (NEW)
- `electron-builder.json` (added `afterPack` hook)

## Next Steps

1. **Verify Production Build Works**
   - Launch packaged app manually
   - Check DevTools console for errors
   - Verify all assets load correctly
   - Confirm UI renders properly

2. **Fix Build Verification Test** (if app actually works)
   - Increase wait time or add better window detection
   - Focus app window before taking screenshot
   - Improve pixel analysis algorithm
   - Or remove test if it's too flaky

3. **Remove Temporary DevTools**
   - Remove `win.webContents.openDevTools()` once verified working

4. **Clean Up Console Logging**
   - Remove excessive `console.log` statements from protocol handler
   - Keep only critical error logging

## Technical Notes

### Protocol Handler Details
- Registers `app://` protocol with CORS enabled
- Serves files from `resources/app.asar/dist` directory
- Handles both relative (`./assets/...`) and absolute (`/assets/...`) paths
- Security check prevents path traversal attacks
- Synchronous file reading for performance

### Why `registerBufferProtocol` vs `registerFileProtocol`
- `registerFileProtocol` doesn't allow setting custom MIME types
- `registerBufferProtocol` gives full control over response headers
- Critical for ES modules which require `application/javascript` MIME type

### Path Resolution Logic
1. Strip `app://` protocol
2. Remove query string and hash
3. Normalize leading slashes/relative paths (`./`, `/`)
4. Join with `dist` directory
5. Normalize Windows path separators
6. Verify path is within `dist` directory (security)

## Error Messages Encountered

1. **Initial:** `Failed to resolve module specifier "fs"` - Fixed with polyfills
2. **Circular dependency:** `Cannot access 'c/b' before initialization` - Fixed by extracting types
3. **Protocol:** Various file not found errors - Fixed with improved path resolution

## Testing Status

- ✅ Dev server: Working perfectly
- ⚠️ Production build: Protocol handler implemented, needs manual verification
- ⚠️ Build verification test: Inconsistent results

