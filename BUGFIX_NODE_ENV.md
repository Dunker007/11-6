# SOLUTION: NODE_ENV=production Bug

**Date:** November 16, 2025
**Problem:** npm install only installing 273 packages instead of 990
**Root Cause:** System environment variable `NODE_ENV=production` preventing devDependencies installation

## The Symptom
```
npm install
# Shows: "audited 274 packages"
# Missing: vite, typescript, electron, and ALL devDependencies

npm run dev
# Error: 'vite' is not recognized
```

## The Diagnosis
```powershell
$env:NODE_ENV
# Returns: "production"
```

When NODE_ENV is set to "production", npm skips devDependencies during install.

## The Solution
```powershell
# Temporary fix (per session):
$env:NODE_ENV="development"
Remove-Item -Recurse -Force node_modules
npm install
# Now shows: "added 989 packages" ✅

# Permanent fix (removes the variable):
[System.Environment]::SetEnvironmentVariable('NODE_ENV', $null, 'User')
# Restart terminal
```

## Lessons Learned
1. Always check environment variables when npm behaves oddly
2. Production mode is for deployment, not development
3. If package count seems low (274 vs 990), something is blocking devDependencies
4. The husky error was a red herring - NODE_ENV was the real issue

## Files Modified
- Removed `"prepare": "husky install"` from package.json (was failing and distracting from real issue)

---

**Never lose 3 hours to this again.** 🎯
