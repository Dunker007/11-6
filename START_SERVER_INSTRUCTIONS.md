# 🚀 Safe Dev Server Startup Instructions

## The Problem (Desktop Commander Issue)

When using Desktop Commander, the agent was running this dangerous command:

```powershell
# ❌ DANGEROUS - This kills Desktop Commander's file system access!
Get-Process | Where-Object {$_.ProcessName -match "node"} | Stop-Process -Force
```

**Why this is bad:**
- Kills ALL node processes (not just dev servers)
- Kills Desktop Commander's MCP server process
- Loses file system access
- Agent can't continue working

---

## The Solution (Safe Scripts)

I created two safe startup scripts that **ONLY** kill dev servers on specific ports:

### Option 1: PowerShell Script (Recommended)
**File:** `start-dev-safe.ps1`

**Features:**
- ✅ Safely kills only dev servers on ports 3000, 4173, 5173, 8080, 8081
- ✅ Checks if it's a node/vite/npm/electron process before killing
- ✅ Preserves Desktop Commander and other essential processes
- ✅ Handles missing dependencies automatically
- ✅ Works around Sharp and Husky installation issues
- ✅ Provides detailed status messages

**How to use:**
```powershell
# In PowerShell (in the project directory):
.\start-dev-safe.ps1

# If you get execution policy errors:
PowerShell -ExecutionPolicy Bypass -File .\start-dev-safe.ps1
```

### Option 2: Batch File (Simple)
**File:** `start-dev-safe.bat`

**Features:**
- ✅ Simpler version without port checking
- ✅ Installs dependencies if missing
- ✅ Starts dev server
- ✅ Works on any Windows system

**How to use:**
```batch
# Just double-click the file, or run from Command Prompt:
start-dev-safe.bat
```

---

## Manual Method (If Scripts Don't Work)

### Step 1: Kill Only Dev Servers (Safe Method)

**PowerShell:**
```powershell
# Kill processes on specific dev server ports
$devPorts = @(3000, 4173, 5173, 8080, 8081)
foreach ($port in $devPorts) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force
    }
}
```

**OR use Task Manager:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Look for "Node.js: Server-side JavaScript" processes
3. Check the PID and port in details
4. Only kill processes on ports 3000, 4173, 5173, 8080, 8081

### Step 2: Install Dependencies

```powershell
npm install --legacy-peer-deps --ignore-scripts
```

**Why these flags?**
- `--legacy-peer-deps` - Handles peer dependency conflicts
- `--ignore-scripts` - Skips husky and other post-install scripts that fail

### Step 3: Start Dev Server

```powershell
npm run dev
```

---

## What Ports Are Used?

| Port | Purpose |
|------|---------|
| 5173 | Vite dev server (default) |
| 4173 | Vite preview server |
| 3000 | Alternative dev port |
| 8080 | Common alternative port |
| 8081 | Another alternative |

---

## Troubleshooting

### "vite is not recognized"
**Solution:** node_modules not installed or corrupted
```powershell
Remove-Item node_modules -Recurse -Force
npm install --legacy-peer-deps --ignore-scripts
```

### "husky install failed"
**Solution:** Use `--ignore-scripts` flag
```powershell
npm install --legacy-peer-deps --ignore-scripts
```

### "Sharp installation error"
**Solution:** Already handled in the safe scripts - Sharp is stubbed out

### Port Already in Use
**Solution:** Run the PowerShell script which automatically kills old dev servers
```powershell
.\start-dev-safe.ps1
```

---

## For Desktop Commander / Claude Desktop

**Important for the AI agent:**

When working with the user's Windows PC via Desktop Commander:

```powershell
# ✅ SAFE - Only kills dev servers on specific ports
$devPorts = @(3000, 4173, 5173, 8080, 8081)
foreach ($port in $devPorts) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and ($proc.ProcessName -match "node|npm|vite|electron")) {
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}
```

**DO NOT USE:**
```powershell
# ❌ DANGEROUS - Kills Desktop Commander!
Get-Process | Where-Object {$_.ProcessName -match "node"} | Stop-Process -Force
Stop-Process -Name "node" -Force  # Also dangerous
pkill node  # Dangerous on Windows with WSL
```

---

## After Starting Successfully

Once the dev server starts:

1. **Open browser:** http://localhost:5173
2. **Test all 12 tabs:**
   - 📊 Overview
   - 💰 Revenue
   - 📈 Back Office
   - 💎 Wealth Lab
   - 💡 Idea Lab
   - 🤖 Google AI
   - 🧠 AI Intelligence
   - 🔐 Credentials
   - 💻 Idle Computing
   - 🤖 AI Agents
   - 🧪 Integration Tests
   - 🚀 Setup

3. **Check console** for any errors
4. **Report back** what works and what doesn't!

---

## Quick Reference

**Best option for most users:**
```batch
start-dev-safe.bat
```

**Best option for power users:**
```powershell
.\start-dev-safe.ps1
```

**Manual installation:**
```powershell
npm install --legacy-peer-deps --ignore-scripts
npm run dev
```

---

**Need help?** Check the logs in the console output for specific error messages.
