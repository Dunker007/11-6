# Terminal Directory Fix

This directory contains configuration files to ensure terminal commands always run from the correct project directory.

## Files

- `.vscode/settings.json` - Configures Cursor/VS Code to always start terminals in the workspace folder
- `scripts/ensure-directory.ps1` - PowerShell script to manually ensure correct directory (optional)

## How It Works

The `.vscode/settings.json` file sets:
- `terminal.integrated.cwd` to `${workspaceFolder}` - ensures all new terminals start in the project root
- PowerShell profile args to automatically change to the workspace folder on terminal start

## Manual Fix

If terminals still start in the wrong directory, you can manually run:

```powershell
. .\scripts\ensure-directory.ps1
```

Or simply:
```powershell
cd "c:\Repos GIT\11-6"
```

## Verification

To verify the fix is working:
1. Open a new terminal in Cursor
2. Run `pwd` (PowerShell) or `cd` (CMD) to check current directory
3. Should show: `c:\Repos GIT\11-6`
4. Run `npm run dev` - should work without directory errors

