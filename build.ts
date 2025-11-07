import { build } from 'vite';
import { build as electronBuild } from 'electron-builder';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build Vite app
await build();

// Build Electron main process
const electronPath = path.join(__dirname, '../node_modules/.bin/electron');
const mainPath = path.join(__dirname, '../electron/main.ts');

// For now, we'll use tsx or ts-node to run TypeScript directly
// In production, we'd compile to JS first

console.log('Build complete!');

