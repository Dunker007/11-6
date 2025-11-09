# Quick Reference - Resuming Development

## Getting Started

```bash
cd llm-optimizer
npm install
npm run electron:dev
```

## Project Overview

LLM Optimizer is a desktop application built with Electron + React + TypeScript that helps optimize LLM setups and manage development tools.

## Key Files

- `electron/main.ts` - Main process, IPC handlers
- `electron/preload.ts` - Secure API bridge
- `src/App.tsx` - Main React component
- `src/components/` - UI components
- `src/services/` - Business logic services

## Current Features

1. System Overview - Hardware detection
2. LLM Detection - LM Studio/Ollama/Bolt.diy
3. Benchmark Runner - Model performance testing
4. Model Library - Benchmark result storage
5. Bolt.diy Optimizer - Configuration optimization
6. Dev Tools Manager - Automated tool installation
7. Filesystem Manager - Drive browsing and cleanup

## Development Commands

```bash
npm run dev              # Start Vite dev server
npm run electron:dev     # Start Electron app
npm run build            # Build for production
npm run typecheck        # Type check
npm run lint             # Lint code
npm run format           # Format code
```

## Architecture

- **Main Process**: Electron main process handles system operations
- **Renderer Process**: React UI runs in renderer
- **IPC**: Secure communication via preload script
- **State**: Zustand for client-side state
- **Storage**: localStorage for model library

## Important Notes

- All file operations include safety checks
- Cleanup only removes files older than 7 days
- Admin privileges requested when needed
- Tool installations are automated but may need actual download URLs

## Next Steps

See `RESEARCH_NOTES.md` for bolt.diy forking exploration.

