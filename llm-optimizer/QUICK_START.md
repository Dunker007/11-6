# LLM Optimizer - Quick Start Guide

## Getting Started

1. **Install Dependencies**
   ```bash
   cd llm-optimizer
   npm install
   ```

2. **Run Development Mode**
   ```bash
   npm run electron:dev
   ```

3. **Build for Production**
   ```bash
   npm run electron:build
   ```

## First Steps

1. **Check System Overview** - See your PC specs and recommendations
2. **Detect LLM Tools** - Verify LM Studio/Ollama installation
3. **Start Benchmarking** - Test models to build your library
4. **Optimize Bolt.diy** - Auto-configure for best performance

## Benchmarking Tips

- Make sure LM Studio or Ollama is running before benchmarking
- Use consistent API URLs for accurate comparisons
- Run benchmarks multiple times for better averages
- Compare models with similar parameter counts

## Troubleshooting

**LM Studio not detected:**
- Check if LM Studio is installed in default locations
- Manually verify the installation path

**Ollama not detected:**
- Ensure Ollama is in your system PATH
- Try running `ollama --version` in terminal

**Benchmark fails:**
- Verify the API server is running
- Check the API URL is correct
- Ensure the model name matches exactly

