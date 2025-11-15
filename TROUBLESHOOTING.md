# Troubleshooting Guide

## Common Issues and Solutions

### Installation & Setup

#### Issue: `npm install` fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### Issue: Dev server won't start
**Solution:**
```bash
# Check if port 5174 is already in use
netstat -ano | findstr :5174  # Windows
lsof -i :5174  # macOS/Linux

# Kill the process or change port in vite.config.ts
```

---

### LLM Provider Issues

#### Issue: Ollama not detected
**Checklist:**
- ✅ Ollama service is running (`ollama serve`)
- ✅ Default port is 11434
- ✅ At least one model is pulled (`ollama pull llama2`)
- ✅ Test connection: `curl http://localhost:11434`

**Solution:**
```bash
# Start Ollama service
ollama serve

# Pull a model
ollama pull llama2

# Verify it's running
ollama list
```

#### Issue: LM Studio not detected
**Checklist:**
- ✅ LM Studio server is started (Server tab)
- ✅ Default port is 1234
- ✅ At least one model is loaded
- ✅ CORS is enabled in LM Studio settings

**Solution:**
1. Open LM Studio
2. Go to "Local Server" tab
3. Click "Start Server"
4. Verify port is 1234

#### Issue: Gemini API key not working
**Solution:**
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Open Settings → LLM → Cloud Providers
3. Enter key for Gemini
4. Click "Test Connection"

**Common mistakes:**
- Using old/expired API key
- Insufficient quota (check [API console](https://console.cloud.google.com/))
- Wrong region restrictions

---

### Performance Issues

#### Issue: Slow startup
**Causes:**
- Large number of models installed locally
- Heavy GPU monitoring
- IndexedDB full of old data

**Solutions:**
```bash
# Clear storage from DevTools (F12)
localStorage.clear();
indexedDB.deleteDatabase('vibed-ed');

# Disable GPU monitoring in Settings
# Limit model catalog size (uninstall unused models)
```

#### Issue: High memory usage
**Solution:**
```bash
# Check Node.js memory limit
node --max-old-space-size=4096 node_modules/.bin/vite

# Disable heavy features temporarily:
# - Hardware Profiler (in LLM Optimizer)
# - Real-time benchmarking
```

#### Issue: Browser cache issues (stale code)
**Solution:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe  # Windows
killall node  # macOS/Linux

# Clear Vite cache
rm -rf node_modules/.vite
rm -rf .vite

# Hard refresh browser
Ctrl+Shift+R  # or Cmd+Shift+R on macOS
```

---

### Build & Deployment

#### Issue: TypeScript errors during build
**Solution:**
```bash
# Run type check to see all errors
npm run typecheck

# Fix errors incrementally
# Common issues:
# - Missing types (install @types/*)
# - Unused variables (remove or prefix with _)
# - Type mismatches (add type assertions)
```

#### Issue: Build succeeds but app crashes
**Solution:**
1. Check the console for errors (F12)
2. Look for missing environment variables
3. Verify all dependencies are production-ready
4. Test in production mode locally:
```bash
npm run build
npm run preview
```

---

### Crash & Error Recovery

#### Issue: Application crashes on startup
**Check logs:**
- Browser console (F12)
- Terminal output
- `~/.cursor/logs/` (Cursor logs)

**Solutions:**
1. **Reset storage:**
```javascript
// In browser console (F12)
localStorage.clear();
indexedDB.deleteDatabase('vibed-ed');
location.reload();
```

2. **Reset settings:**
- Delete `%APPDATA%\dlx-studios` (Windows)
- Delete `~/Library/Application Support/dlx-studios` (macOS)
- Delete `~/.config/dlx-studios` (Linux)

#### Issue: WebGL context errors
**Symptoms:**
- "Too many active WebGL contexts"
- GPU rendering failures

**Solution:**
- Disable Hardware Profiler in LLM Optimizer
- Restart browser
- Update graphics drivers

#### Issue: Quota exceeded errors
**Solution:**
The app has automatic quota management, but you can manually clear:
```javascript
// In browser console
const storageService = await import('./src/services/storage/storageService.ts');
await storageService.storageService.clear();
```

---

### Git & Development

#### Issue: Git worktree confusion
**Symptoms:**
- Multiple working directories
- Changes not reflected
- Confusion about active branch

**Solution:**
```bash
# List all worktrees
git worktree list

# Remove extra worktrees
git worktree remove main-worktree

# Prune stale references
git worktree prune

# Verify you're in main directory
pwd  # Should show: 11-6 (or c:\Repos GIT\11-6 on Windows)
```

#### Issue: Merge conflicts
**Solution:**
```bash
# Abort merge
git merge --abort

# Or resolve manually
# 1. Edit conflicted files
# 2. Stage resolved files
git add .
git commit
```

---

### Feature-Specific Issues

#### Issue: Google AI Hub not working
**Checklist:**
- ✅ Gemini API key configured
- ✅ Internet connection active
- ✅ API quota not exceeded
- ✅ Browser has camera permission (for Vision features)

#### Issue: WealthLab portfolio not loading
**Solution:**
1. Check if data is stored: DevTools → Application → IndexedDB → `vibed-ed`
2. Clear portfolio cache: Settings → Advanced → Clear Cache
3. Re-import data if needed

#### Issue: Project creation fails
**Check:**
- Disk space available
- Write permissions in target directory
- Template files exist in `src/services/project/`

---

## Getting Help

### Before asking for help:
1. ✅ Check this troubleshooting guide
2. ✅ Read [QUICK_START.md](QUICK_START.md)
3. ✅ Check browser console for errors (F12)
4. ✅ Review [AI_SERVICES_CONSOLIDATION.md](AI_SERVICES_CONSOLIDATION.md) for architecture

### Reporting Issues

When reporting a bug, include:
```
**Environment:**
- OS: [Windows/macOS/Linux + version]
- Node.js version: [run `node -v`]
- Browser: [Chrome/Edge/Firefox + version]

**Issue:**
[Clear description of the problem]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Console Errors:**
[Paste from F12 → Console]

**Expected vs Actual:**
- Expected: [what should happen]
- Actual: [what actually happens]
```

---

## Emergency Reset

If all else fails, perform a complete reset:

```bash
# 1. Kill all processes
taskkill /F /IM node.exe  # Windows
killall node  # macOS/Linux

# 2. Delete all caches
rm -rf node_modules .vite node_modules/.vite

# 3. Clear browser storage
# Open DevTools (F12) → Application → Clear storage

# 4. Reinstall
npm install

# 5. Start fresh
npm run dev
```

---

## Performance Optimization Tips

### For Daily Development:
- Disable Hardware Profiler when not needed
- Use individual model tests instead of "Test All"
- Clear activity log periodically (Settings → Activity)
- Close unused workflows

### For Production:
- Build with `npm run build` (creates optimized bundle)
- Use `--max-old-space-size=4096` if memory limited
- Enable code splitting in `vite.config.ts` (already configured)
- Monitor bundle size with `npm run build -- --profile`

---

## Platform-Specific Notes

### Windows
- Use PowerShell or Windows Terminal (not CMD)
- Defender may flag Electron builds (add exception)
- Long path names can cause issues (keep project path short)

### macOS
- May need to grant permissions in System Preferences
- Gatekeeper may block unsigned builds (`xattr -cr DLX\ Studios.app`)

### Linux
- Install `libatk-bridge2.0-0` for Electron
- May need to run `npm rebuild` after updates

---

**Last Updated:** November 13, 2025  
**For more help:** See [README.md](README.md) or [QUICK_START.md](QUICK_START.md)

