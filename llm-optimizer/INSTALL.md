# LLM Optimizer - Installation Instructions

## Quick Setup

1. **Navigate to the project directory:**
   ```bash
   cd llm-optimizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run electron:dev
   ```

## Building for Production

To create an installable application:

```bash
npm run electron:build
```

The built application will be in the `release` directory:
- **Windows:** `release/LLM Optimizer Setup.exe`
- **macOS:** `release/LLM Optimizer.dmg`
- **Linux:** `release/LLM Optimizer.AppImage`

## Features Overview

### 1. System Overview
- View CPU, RAM, and GPU specifications
- Get recommendations for model sizes based on your hardware

### 2. LLM Detection
- Automatically detects LM Studio, Ollama, and Bolt.diy
- Provides setup instructions if not installed

### 3. Benchmark Runner
- Test LLM models for performance
- Measures tokens/second, latency, memory usage
- Calculates quality scores

### 4. Model Library
- Store all benchmark results
- Sort and filter by various metrics
- Compare models side-by-side

### 5. Bolt.diy Optimizer
- Auto-optimize configuration based on system specs
- Fine-tune memory, context size, threads, GPU layers

## Troubleshooting

**If the app won't start:**
- Make sure Node.js 18+ is installed
- Run `npm install` to ensure all dependencies are installed
- Check that port 5173 is available (for dev mode)

**If system detection fails:**
- Make sure you have proper permissions
- On Windows, try running as administrator

**If benchmarking fails:**
- Ensure LM Studio or Ollama is running
- Check that the API URL is correct
- Verify the model name matches exactly

## Next Steps

1. Check your system specs in the Overview tab
2. Detect your LLM tools
3. Start benchmarking models
4. Build your model library
5. Optimize Bolt.diy settings

Enjoy optimizing your LLM setup! 🚀

