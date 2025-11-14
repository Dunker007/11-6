# Google AI Hub

## Overview

Google AI Hub is a comprehensive suite of AI-powered features built on Google's Gemini models. It provides four main capabilities accessible through a unified interface within the LLM Optimizer panel.

## Features

### 1. AI Studio Projects
Import and run projects exported from Gemini AI Studio with full support for:
- Model configuration (temperature, tokens, topP, topK)
- Function calling with custom tools
- Prompt templates and examples
- Real-time execution with streaming responses

**How to Use:**
1. Navigate to LLM Optimizer → Google AI Hub → AI Studio tab
2. Click "Choose File" and select a `.zip` file exported from Gemini AI Studio
3. Review the imported project configuration
4. Enter input or use the default prompt
5. Click "Run Project" to execute

### 2. Visual to Code
Convert UI screenshots and design mockups into code using Gemini Vision:
- Upload images (JPG, PNG, WebP, GIF)
- Drag-and-drop support
- Custom prompts for specific frameworks
- Image preview before processing

**How to Use:**
1. Go to Visual to Code tab
2. Drag an image or click "Select Image"
3. Modify the prompt if needed (e.g., "Generate React component...")
4. Click "Generate Code"
5. Copy the generated code

### 3. Smart Comments
AI-powered code analysis using Google Cloud Natural Language API:
- Sentiment analysis of code comments
- Entity extraction (variables, functions, etc.)
- Comment quality assessment
- Automatic code insights

**How to Use:**
1. Open a file in the editor
2. Navigate to Smart Comments tab
3. Click "Analyze Active File"
4. Review sentiment and entity analysis results

### 4. Project Q&A
Ask natural language questions about your codebase:
- Powered by NotebookLM integration
- Project-wide context awareness
- Question history
- Formatted answers with sources

**How to Use:**
1. Open a project
2. Go to Project Q&A tab
3. Type your question (e.g., "How is authentication handled?")
4. Press Cmd/Ctrl+Enter or click "Ask"
5. Review the answer and sources

## Setup

### API Key Configuration

1. Navigate to Settings → API Keys
2. Add your Gemini API key:
   - Get key from: https://ai.google.dev/gemini-api/docs/api-key
   - Provider: `gemini`
   - Paste your key
3. (Optional) Add Google Cloud NL API key for Smart Comments
4. (Optional) Configure NotebookLM for Project Q&A

### Keyboard Shortcuts

- `1` - Switch to AI Studio tab
- `2` - Switch to Visual to Code tab
- `3` - Switch to Smart Comments tab
- `4` - Switch to Project Q&A tab

## Architecture

### Components

- **GoogleAIHub** (`src/components/LLMOptimizer/GoogleAIHub.tsx`) - Main hub component with tab navigation
- **ProjectHost** (`src/components/GeminiStudio/ProjectHost.tsx`) - AI Studio project runner
- **VisualToCode** (`src/components/Vision/VisualToCode.tsx`) - Image-to-code generator
- **SmartCommentsPanel** (`src/components/CodeAnalysis/SmartCommentsPanel.tsx`) - Code analysis
- **ProjectQA** (`src/components/GoogleAI/ProjectQA.tsx`) - Q&A interface

### Services

- **geminiStudioService** - Handles project import and parsing
- **geminiFunctionRegistry** - Manages function calling declarations
- **googleCloudNLProvider** - Natural Language API integration
- **notebookLMService** - NotebookLM API integration
- **llmRouter** - LLM request routing and management

## Troubleshooting

### "Gemini API Key Required" Warning

**Problem:** Banner appears indicating missing API key.

**Solution:**
1. Go to Settings → API Keys
2. Add a valid Gemini API key
3. Refresh the Google AI Hub

### Project Import Fails

**Problem:** Error when importing AI Studio project.

**Solution:**
1. Ensure the file is a valid `.zip` from Gemini AI Studio
2. Check the file isn't corrupted
3. Verify it contains a `manifest.json`
4. Review console logs for specific errors

### Image Upload Not Working

**Problem:** Visual to Code doesn't accept images.

**Solution:**
1. Check file format (JPG, PNG, WebP, GIF only)
2. Verify file size is under 10MB
3. Ensure Gemini API key has vision permissions
4. Try a different image format

### No Answer from Project Q&A

**Problem:** Questions return empty or error responses.

**Solution:**
1. Verify a project is open
2. Check NotebookLM API key is configured
3. Ensure project files are indexed
4. Try a more specific question
5. Check network connectivity

## Best Practices

### AI Studio Projects
- Test projects in AI Studio before importing
- Use descriptive prompts for better results
- Leverage function calling for dynamic features
- Monitor token usage for cost management

### Visual to Code
- Use high-resolution screenshots for best results
- Be specific in prompts (mention framework, libraries)
- Include context about desired styling
- Iterate on generated code as needed

### Smart Comments
- Write clear, meaningful comments
- Review sentiment analysis for code quality insights
- Use entity extraction to understand code structure
- Combine with other analysis tools

### Project Q&A
- Ask specific, focused questions
- Reference file names or features in questions
- Use follow-up questions to dig deeper
- Save important Q&A pairs for documentation

## Future Enhancements

- [ ] Batch processing for Visual to Code
- [ ] Export AI Studio projects back to zip
- [ ] Smart Comments suggestions for improvement
- [ ] Project Q&A with multi-file context
- [ ] Integration with GitHub Copilot
- [ ] Custom function calling templates
- [ ] Project-wide refactoring suggestions

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for errors
3. Verify API key configuration
4. Check the error capture system (DeveloperConsole)

## Related Documentation

- [Quick Start Guide](../QUICK_START.md)
- [API Key Management](../API_KEYS.md)
- [LLM Router Configuration](../LLM_ROUTER.md)
- [Gemini Integration Review](../reports/GEMINI_INTEGRATION_REVIEW_2025-11-13.md)

