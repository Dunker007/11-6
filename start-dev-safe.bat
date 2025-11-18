@echo off
REM DLX Studios Ultimate - Safe Dev Server Startup (Batch version)
REM This is a simpler version - use the .ps1 for full features

echo.
echo ========================================
echo DLX Studios Ultimate - Starting Dev Server
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INSTALL] node_modules not found. Installing dependencies...
    echo [INSTALL] Running: npm install --legacy-peer-deps --ignore-scripts
    call npm install --legacy-peer-deps --ignore-scripts

    if errorlevel 1 (
        echo [ERROR] npm install failed. Please check the error above.
        pause
        exit /b 1
    )

    echo [SUCCESS] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

echo.
echo ========================================
echo Starting Vite Dev Server
echo ========================================
echo.
echo Open your browser to: http://localhost:5173
echo Press Ctrl+C to stop the server
echo.

REM Start the dev server
call npm run dev

echo.
echo [STOPPED] Dev server stopped
pause
