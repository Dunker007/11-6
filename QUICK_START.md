# DLX Studios Ultimate - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm package manager
- Git for version control

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd dlx-studios-ultimate

# Install dependencies
npm install

# Start development server
npm run dev

# In a separate terminal, start Electron
npm run electron:dev
```

The application will open automatically in a new Electron window.

---

## 🎯 Core Features

### 1. LLM Optimization (Alt+1)

**What it does**: Manage and optimize your local and cloud LLM providers.

**Key Features**:
- **Provider Detection**: Automatically discovers Ollama, LM Studio, Gemini, etc.
- **Model Catalog**: Browse and favorite models
- **Benchmarking**: Test model performance (latency, throughput)
- **Token Tracking**: Monitor usage and costs

**Quick Actions**:
- Click ⭐ to favorite models (they appear at the top)
- Click "Pull Model" to download from Ollama
- Run benchmarks to compare models
- Check token usage in the right panel

### 2. Google AI Hub (Alt+4)

**What it does**: Powerful Gemini-powered AI features in one place.

#### Visual-to-Code (Tab 2)
1. Drag & drop a screenshot of UI
2. Enter a prompt (e.g., "Generate React component")
3. Click "Generate Code"
4. Copy the generated code

#### Smart Comments (Tab 3)
1. Open a file in your project
2. Click "Analyze Active File"
3. View sentiment analysis and entities from code comments

#### Project Q&A (Tab 4)
1. Open/create a project
2. Ask questions about your codebase
3. Get AI-powered answers with source citations

#### AI Studio Projects (Tab 1)
1. Export a project from [Gemini AI Studio](https://aistudio.google.com/)
2. Import the `.zip` file
3. Run it locally with your own API key

### 3. Workflows (Alt+8)

**What it does**: Automate project tasks with AI-powered workflows.

**Available Workflows**:
- **Project**: Create, analyze, and initialize projects
- **Build**: Configure and run build commands
- **Deploy**: Deployment configurations
- **Monitor**: System health and metrics
- **Monetize**: Revenue stream setup

**How to Use**:
1. Select a workflow type from the sidebar
2. Fill in configuration (project name, build command, etc.)
3. Click "Create Workflow"
4. Watch progress in real-time
5. Cancel anytime if needed

---

## ⚙️ Configuration

### API Keys (Settings → API Keys)

Required for cloud features:

1. **Gemini API Key**: 
   - Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Required for: Google AI Hub, cloud generation
   
2. **NotebookLM** (optional):
   - Uses Gemini key if not provided
   - Enhanced project Q&A

3. **OpenRouter** (optional):
   - Fallback for cloud models

4. **Local LLMs** (no API key needed):
   - Install [Ollama](https://ollama.com/) or [LM Studio](https://lmstudio.ai/)
   - Start the server
   - DLX Studios will auto-detect it

### Storage Management (Settings → Storage)

Monitor and manage local storage:
- View usage statistics
- Export diagnostics
- Clear all data (emergency reset)

---

## 🎨 Keyboard Shortcuts

### Navigation
- `Alt+1` → LLM Optimization
- `Alt+2` → Revenue Dashboard
- `Alt+3` → Vibed Ed (Code Editor)
- `Alt+4` → Google AI Hub ⭐
- `Alt+5` → Crypto Lab
- `Alt+6` → Wealth Lab
- `Alt+7` → Idea Lab
- `Alt+8` → Workflows
- `Alt+9` → Quick Labs
- `Alt+0` → Settings

### Google AI Hub Sub-tabs
- `1` → AI Studio Projects
- `2` → Visual-to-Code
- `3` → Smart Comments
- `4` → Project Q&A

### Other
- `Ctrl+Shift+I` → Toggle Insights Stream
- `Ctrl+Enter` → Submit (in text areas)

---

## 🔧 Troubleshooting

### App Not Loading
1. Check console for errors (F12)
2. Clear storage: Settings → Storage → Clear All
3. Restart the app

### localStorage Quota Errors
**Fixed!** The app now uses intelligent storage management:
- Low-priority data auto-clears when needed
- IndexedDB fallback for large data
- One-time migration on first launch

### LLM Providers Not Detected
1. Ensure Ollama/LM Studio is running
2. Check provider status in left panel
3. Manually trigger discovery: Click refresh icon

### API Errors
1. Verify API key in Settings
2. Check network connection
3. View detailed errors in Settings → Storage → Export Diagnostics

---

## 📚 Next Steps

1. **Set up your first local LLM**:
   - Install Ollama
   - Pull a model: `ollama pull llama2`
   - DLX will auto-detect it!

2. **Try Google AI Hub**:
   - Add Gemini API key
   - Take a screenshot of UI
   - Generate code in seconds

3. **Create a project**:
   - Go to Workflows → Project
   - Create a new project
   - Let AI analyze and generate structure

4. **Benchmark your models**:
   - LLM Optimization → BenchmarkRunner
   - Select models to test
   - Compare performance

---

## 🆘 Need Help?

- Check the console (F12) for detailed logs
- Export diagnostics: Settings → Storage → Export Diagnostics
- Review `AI_SERVICES_CONSOLIDATION.md` for architecture details
- See `PRODUCTION_PLAN.md` for feature status

---

**Happy building! 🚀**
