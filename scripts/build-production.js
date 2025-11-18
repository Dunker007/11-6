#!/usr/bin/env node

/**
 * build-production.js
 *
 * Production build script for DLX Studios
 * Optimizes bundle, generates sourcemaps, and prepares for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...\n');

// Clean dist directory
console.log('📦 Cleaning dist directory...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}

// Build with Vite
console.log('🔨 Building with Vite...');
try {
  execSync('vite build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Generate build info
console.log('📝 Generating build info...');
const buildInfo = {
  version: require('../package.json').version,
  buildDate: new Date().toISOString(),
  gitCommit: execSync('git rev-parse HEAD').toString().trim(),
  gitBranch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
};

fs.writeFileSync(
  path.join('dist', 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Build info generated\n');

// Analyze bundle size
console.log('📊 Bundle analysis:');
const distFiles = fs.readdirSync('dist');
distFiles.forEach((file) => {
  const filePath = path.join('dist', file);
  if (fs.statSync(filePath).isFile()) {
    const size = fs.statSync(filePath).size;
    const sizeKB = (size / 1024).toFixed(2);
    console.log(`  ${file}: ${sizeKB} KB`);
  }
});

console.log('\n✨ Production build complete!');
console.log('📁 Output: ./dist');
