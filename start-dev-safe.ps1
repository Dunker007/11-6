# DLX Studios Ultimate - Safe Dev Server Startup Script
# This script safely manages dev servers WITHOUT killing Desktop Commander or other essential processes

Write-Host "🚀 DLX Studios Ultimate - Starting Dev Server" -ForegroundColor Cyan
Write-Host ("=" * 60)

# Step 1: Kill ONLY dev servers (not Desktop Commander!)
Write-Host "`n📍 Step 1: Checking for existing dev servers..." -ForegroundColor Yellow

# Safe method: Kill only vite/npm dev processes on specific ports
$devPorts = @(3000, 4173, 5173, 8080, 8081)
$killedProcesses = 0

foreach ($port in $devPorts) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

                # Only kill if it's a node/vite/npm process
                if ($process -and ($process.ProcessName -match "node|npm|vite|electron")) {
                    Write-Host "  🔴 Killing dev server on port $port (PID: $processId, Name: $($process.ProcessName))" -ForegroundColor Red
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    $killedProcesses++
                }
            }
        }
    }
    catch {
        # Port not in use, continue
    }
}

if ($killedProcesses -eq 0) {
    Write-Host "  ✅ No existing dev servers found" -ForegroundColor Green
} else {
    Write-Host "  ✅ Killed $killedProcesses dev server(s)" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Step 2: Check if node_modules exists
Write-Host "`n📍 Step 2: Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow

    # Try normal install first
    Write-Host "`n  Attempting: npm install --legacy-peer-deps --ignore-scripts" -ForegroundColor Cyan

    npm install --legacy-peer-deps --ignore-scripts

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  Standard install had issues. Check the error above." -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
    }
} else {
    Write-Host "  ✅ Dependencies already installed" -ForegroundColor Green
}

# Step 3: Check for vite
Write-Host "`n📍 Step 3: Verifying Vite installation..." -ForegroundColor Yellow

$viteExists = Test-Path "node_modules\.bin\vite.cmd"
if (-not $viteExists) {
    Write-Host "  ⚠️  Vite not found. Installing vite specifically..." -ForegroundColor Yellow
    npm install vite@latest --save-dev --legacy-peer-deps
}
Write-Host "  ✅ Vite ready" -ForegroundColor Green

# Step 4: Build check (optional - just verify it can build)
Write-Host "`n📍 Step 4: Quick build verification..." -ForegroundColor Yellow
Write-Host "  ℹ️  Skipping full build, will start dev server directly" -ForegroundColor Cyan

# Step 5: Start dev server
Write-Host "`n📍 Step 5: Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host ("=" * 60)
Write-Host "🌐 Dev server will start on: http://localhost:5173" -ForegroundColor Green
Write-Host "🔥 All 12 tabs should be accessible!" -ForegroundColor Green
Write-Host ("=" * 60)
Write-Host ""

# Start the dev server
npm run dev

Write-Host "`n✅ Dev server stopped" -ForegroundColor Yellow
