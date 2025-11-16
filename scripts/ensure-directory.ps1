# Ensure we're in the correct project directory
# This script can be sourced in PowerShell: . .\scripts\ensure-directory.ps1

$projectRoot = "c:\Repos GIT\11-6"

if (Test-Path $projectRoot) {
    Set-Location $projectRoot
    Write-Host "Changed to project directory: $projectRoot" -ForegroundColor Green
} else {
    Write-Host "Warning: Project directory not found at $projectRoot" -ForegroundColor Yellow
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
}

