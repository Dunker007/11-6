# LLM Optimizer

A desktop application to optimize your LM Studio/Ollama setup, benchmark LLM models, optimize bolt.diy configuration, manage development tools, and clean your filesystem.

## Features

- 🖥️ **System Overview** - View detailed system specifications (CPU, RAM, GPU) with recommendations
- 🔍 **LLM Detection** - Automatically detect LM Studio, Ollama, and Bolt.diy installations
- ⚡ **Benchmark Runner** - Test and benchmark LLM models for performance
- 📚 **Model Library** - Store and compare benchmark results
- ⚙️ **Bolt.diy Optimizer** - Optimize your Bolt.diy configuration based on system specs
- 🛠️ **Dev Tools Manager** - Automatically install and manage development tools (Node.js, Python, Git, Docker, VS Code, etc.)
- 💾 **Filesystem Manager** - Browse drives, manage files, and perform automated system cleanup

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run electron:dev
```

4. Build for production:
```bash
npm run electron:build
```

The built application will be in the `release` directory.

## Usage

### System Overview
View your system specifications and get recommendations for which models to use based on your hardware.

### LLM Detection
The app automatically detects if you have LM Studio, Ollama, or Bolt.diy installed. If not detected, it provides setup instructions.

### Benchmark Runner
1. Make sure your LLM server (LM Studio or Ollama) is running
2. Enter the model name you want to benchmark
3. Select the provider (LM Studio or Ollama)
4. Enter the API URL (defaults provided)
5. Click "Start Benchmark" to run tests

The benchmark measures:
- Tokens per second (generation speed)
- Latency (response time)
- Memory usage
- Overall quality score

### Model Library
View all your benchmarked models, sort by quality, speed, memory usage, or date. Compare models to find the best performers for your system.

### Dev Tools Manager
Automatically install and manage popular development tools:
- **Runtimes**: Node.js, Python
- **Version Control**: Git
- **Containers**: Docker Desktop
- **Editors**: VS Code
- **Package Managers**: npm, yarn, pnpm

Tools are detected automatically and can be installed with one click. Installations are fully automated with safety checks.

### Filesystem Manager
Browse your drives, manage files, and perform automated system cleanup:
- **Drive Browser**: View all drives and browse directories
- **File Operations**: Delete, move, copy files and directories
- **System Cleanup**: Automated cleanup with safety checks:
  - Temp files (removes files older than 7 days)
  - Cache files (npm, pip, browser caches)
  - Windows registry cleanup
  - Old installation detection
  - Deep clean (comprehensive automated cleanup)

All cleanup operations include safety checks and only remove safe files.

## Requirements

- Node.js 18+
- Windows, macOS, or Linux
- LM Studio or Ollama (for benchmarking)
- Bolt.diy (for optimization features)

## Development

Built with:
- Electron
- React
- TypeScript
- Vite
- Zustand (state management)
- Systeminformation (system detection)

## License

MIT

