const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  console.log('\n========================================');
  console.log('Running Build Verification...');
  console.log('========================================\n');

  const appOutDir = context.appOutDir;
  const platform = context.electronPlatformName;
  
  let executablePath;
  if (platform === 'win32') {
    executablePath = path.join(appOutDir, 'DLX Studios Ultimate.exe');
  } else if (platform === 'darwin') {
    executablePath = path.join(appOutDir, 'DLX Studios Ultimate.app', 'Contents', 'MacOS', 'DLX Studios Ultimate');
  } else {
    executablePath = path.join(appOutDir, 'dlx-studios-ultimate');
  }

  console.log(`Verifying packaged app: ${executablePath}`);
  
  if (!fs.existsSync(executablePath)) {
    throw new Error(`Executable not found: ${executablePath}`);
  }

  // Launch the app
  console.log('Launching application for verification...');
  const child = spawn(executablePath, [], {
    detached: true,
    stdio: 'ignore'
  });

  // Wait for app to start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Take screenshot (using native Windows/Mac tools)
  const screenshotPath = path.join(appOutDir, 'verification-screenshot.png');
  console.log(`Screenshot will be saved to: ${screenshotPath}`);
  
  if (platform === 'win32') {
    // Use PowerShell to take screenshot
    const psScriptFile = path.join(appOutDir, 'take-screenshot.ps1');
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $bitmap.Save('${screenshotPath.replace(/\\/g, '\\\\')}')
      $graphics.Dispose()
      $bitmap.Dispose()
      Write-Host "Screenshot saved successfully"
    `;
    fs.writeFileSync(psScriptFile, psScript);
    
    const { execSync } = require('child_process');
    try {
      execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptFile}"`, { stdio: 'inherit' });
      console.log('Screenshot command executed');
    } catch (error) {
      console.error('Failed to take screenshot:', error.message);
    }
    
    // Clean up the script file
    if (fs.existsSync(psScriptFile)) {
      fs.unlinkSync(psScriptFile);
    }
  }

  // Kill the app
  try {
    if (platform === 'win32') {
      // On Windows, use taskkill to terminate the process tree
      const { execSync } = require('child_process');
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      // On Unix systems, use negative PID to kill process group
      process.kill(-child.pid);
    }
  } catch (error) {
    console.warn('Warning: Could not kill process, it may have already exited');
  }

  // Verify screenshot exists and has content
  if (fs.existsSync(screenshotPath)) {
    const stats = fs.statSync(screenshotPath);
    console.log(`✓ Screenshot captured: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`✓ Screenshot saved to: ${screenshotPath}`);
    
    // Check if file size is reasonable (not just black screen)
    if (stats.size < 10000) {
      console.warn('⚠ Warning: Screenshot file size is very small - might indicate rendering issue');
    }
    
    console.log('\n========================================');
    console.log('✓ Build Verification PASSED');
    console.log('========================================\n');
  } else {
    throw new Error('Screenshot was not created - verification failed');
  }
};

