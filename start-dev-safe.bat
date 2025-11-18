@echo off
REM DLX Studios Ultimate - Dev Server Startup
REM Simple, reliable startup script

echo.
echo ============================================================
echo DLX Studios Ultimate - Starting Dev Server
echo ============================================================
echo.

REM Step 1: Check if node_modules exists
if not exist "node_modules" (
    echo [STEP 1] Installing dependencies...
    echo Command: npm install --legacy-peer-deps --ignore-scripts
    echo.
    call npm install --legacy-peer-deps --ignore-scripts

    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. Check the errors above.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo [SUCCESS] Dependencies installed successfully!
    echo.
) else (
    echo [STEP 1] Dependencies already installed (node_modules found)
    echo.
)

REM Step 2: Start dev server
echo ============================================================
echo [STEP 2] Starting Vite Dev Server...
echo ============================================================
echo.
echo Open your browser to: http://localhost:4173/
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

call npm run dev

echo.
echo ============================================================
echo [STOPPED] Dev server stopped
echo ============================================================
pause
