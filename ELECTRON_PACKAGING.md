# Electron Packaging Guide

## Overview

This document provides instructions for packaging the DLX Studios Ultimate Electron application for distribution.

## Current Status

**Issue:** electron-builder has a known issue with `@types/systeminformation` that prevents automatic packaging.

**Workaround:** Use electron-packager as an alternative packaging tool.

---

## Option 1: Electron Packager (Recommended)

### Installation

```bash
npm install --save-dev electron-packager
```

### Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "electron:pack:win": "electron-packager . \"DLX Studios Ultimate\" --platform=win32 --arch=x64 --out=release --overwrite --prune=true",
    "electron:pack:mac": "electron-packager . \"DLX Studios Ultimate\" --platform=darwin --arch=x64,arm64 --out=release --overwrite --prune=true",
    "electron:pack:linux": "electron-packager . \"DLX Studios Ultimate\" --platform=linux --arch=x64 --out=release --overwrite --prune=true",
    "electron:pack:all": "npm run electron:pack:win && npm run electron:pack:mac && npm run electron:pack:linux"
  }
}
```

### Usage

```bash
# Build first
npm run build
npm run electron:build:main

# Package for specific platform
npm run electron:pack:win   # Windows
npm run electron:pack:mac   # macOS
npm run electron:pack:linux # Linux
npm run electron:pack:all   # All platforms
```

### Output

Packaged applications will be in `release/DLX Studios Ultimate-<platform>-<arch>/`

---

## Option 2: Electron Builder (With Workaround)

### Issue

electron-builder fails with:
```
dependency path is undefined packageName=@types/systeminformation
```

### Workaround

Exclude `@types/systeminformation` from the build by adding to `electron-builder.json`:

```json
{
  "electronVersion": "39.1.1",
  "buildDependenciesFromSource": false,
  "nodeGypRebuild": false,
  "files": [
    "dist/**/*",
    "dist-electron/**/*",
    "package.json",
    "!**/node_modules/@types/systeminformation/**",
    "!**/node_modules/@types/**/*.d.ts"
  ]
}
```

**Note:** This workaround may not fully resolve the issue. Use electron-packager for reliable packaging.

---

## Manual Packaging Steps

### 1. Build Application

```bash
# Build React frontend
npm run build

# Build Electron main process
npm run electron:build:main
```

### 2. Verify Build Artifacts

- `dist/` - React production build
- `dist-electron/` - Compiled Electron main process

### 3. Package with electron-packager

```bash
npx electron-packager . "DLX Studios Ultimate" \
  --platform=win32 \
  --arch=x64 \
  --out=release \
  --overwrite \
  --prune=true \
  --ignore="^/src" \
  --ignore="^/electron" \
  --ignore="^/\.git" \
  --ignore="^/\.cursor" \
  --ignore="^/docs" \
  --ignore="^/scripts" \
  --ignore="^/llm-optimizer" \
  --ignore="\.md$" \
  --ignore="\.ts$" \
  --ignore="\.tsx$"
```

### 4. Create Installer (Optional)

For Windows, use a tool like NSIS or Inno Setup to create an installer from the packaged app.

---

## Distribution Checklist

- [ ] Build passes (`npm run build && npm run electron:build:main`)
- [ ] Application runs from `dist-electron/` directory
- [ ] Package created successfully
- [ ] Test packaged application on target platform
- [ ] Verify all features work in packaged version
- [ ] Test auto-updater (if enabled)
- [ ] Create installer (optional)
- [ ] Upload to GitHub Releases

---

## Troubleshooting

### Issue: Packaging fails with dependency errors

**Solution:** Use electron-packager instead of electron-builder.

### Issue: Package is too large

**Solution:** 
- Ensure `node_modules` are pruned correctly
- Exclude unnecessary files in packaging configuration
- Consider code splitting optimizations

### Issue: Application doesn't start after packaging

**Solution:**
- Verify `dist/` and `dist-electron/` are included
- Check that all required dependencies are bundled
- Test the built application before packaging

---

## Notes

- electron-packager is simpler and more reliable for basic packaging needs
- electron-builder provides more features (installers, auto-updates) but has known issues
- Manual packaging gives full control but requires more setup
- Consider CI/CD automation for consistent packaging

---

**Last Updated:** November 2025  
**Status:** electron-packager recommended until electron-builder issue is resolved

