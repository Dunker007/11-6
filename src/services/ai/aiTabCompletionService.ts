/**
 * aiTabCompletionService.ts
 * 
 * PURPOSE:
 * Service for GitHub Copilot-style Tab completion. Provides multi-line code suggestions
 * that appear as ghost text and can be accepted with Tab key.
 * 
 * ARCHITECTURE:
 * Service that integrates with Monaco Editor to provide inline AI suggestions:
 * - Detects when user pauses typing
 * - Generates multi-line code suggestions
 * - Displays as ghost text in editor
 * - Accepts with Tab, dismisses with Escape
 * 
 * Features:
 * - Multi-line code completion
 * - Context-aware suggestions
 * - Ghost text display
 * - Tab to accept, Escape to dismiss
 * 
 * CURRENT STATUS:
 * ✅ Tab completion detection
 * ✅ AI suggestion generation
 * ✅ Ghost text display
 * 
 * DEPENDENCIES:
 * - llmRouter: LLM provider routing
 * - Monaco Editor: Editor integration
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { aiTabCompletionService } from '@/services/ai/aiTabCompletionService';
 * 
 * aiTabCompletionService.initialize(editor, monaco);
 * ```
 */

import type * as Monaco from 'monaco-editor';
import { llmRouter } from './router';
import { logger } from '../logging/loggerService';
import { useLLMStore } from './llmStore';

export interface TabCompletionSuggestion {
  text: string;
  range: Monaco.IRange;
}

class AITabCompletionService {
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof Monaco | null = null;
  private currentSuggestion: TabCompletionSuggestion | null = null;
  private suggestionDecoration: string[] = [];
  private typingTimeout: NodeJS.Timeout | null = null;
  private isGenerating = false;
  private disposables: Monaco.IDisposable[] = [];

  /**
   * Initialize tab completion service
   */
  initialize(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco): void {
    this.editor = editor;
    this.monaco = monaco;

    // Listen for typing to trigger suggestions
    this.editor.onDidChangeModelContent(() => {
      this.handleContentChange();
    });

    // Listen for key events
    this.editor.onKeyDown((e) => {
      this.handleKeyDown(e);
    });

    // Clear suggestion when cursor moves
    this.editor.onDidChangeCursorPosition(() => {
      this.clearSuggestion();
    });
  }

  /**
   * Handle content changes - trigger suggestion after pause
   */
  private handleContentChange(): void {
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Clear current suggestion
    this.clearSuggestion();

    // Wait for pause in typing (500ms)
    this.typingTimeout = setTimeout(() => {
      this.generateSuggestion();
    }, 500);
  }

  /**
   * Handle key down events
   */
  private handleKeyDown(e: Monaco.IKeyboardEvent): void {
    if (!this.editor || !this.monaco || !this.currentSuggestion) {
      return;
    }

    // Tab to accept
    if (e.keyCode === this.monaco.KeyCode.Tab && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      this.acceptSuggestion();
      return;
    }

    // Escape to dismiss
    if (e.keyCode === this.monaco.KeyCode.Escape) {
      this.clearSuggestion();
      return;
    }

    // Any other key dismisses
    if (e.keyCode !== this.monaco.KeyCode.Shift && 
        e.keyCode !== this.monaco.KeyCode.Ctrl &&
        e.keyCode !== this.monaco.KeyCode.Meta) {
      this.clearSuggestion();
    }
  }

  /**
   * Generate AI suggestion
   */
  private async generateSuggestion(): Promise<void> {
    if (!this.editor || !this.monaco || this.isGenerating) {
      return;
    }

    // Check if LLM is available
    const llmStore = useLLMStore.getState();
    if (!llmStore.availableProviders || llmStore.availableProviders.length === 0) {
      return;
    }

    const position = this.editor.getPosition();
    if (!position) {
      return;
    }

    const model = this.editor.getModel();
    if (!model) {
      return;
    }

    // Get context
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    });

    // Only suggest if there's meaningful context
    if (textUntilPosition.trim().length < 10) {
      return;
    }

    this.isGenerating = true;

    try {
      // Build prompt for multi-line completion
      const prompt = this.buildCompletionPrompt(textUntilPosition, position);

      // Generate suggestion
      const response = await llmRouter.generate(prompt, {
        temperature: 0.3, // Lower for more deterministic
        maxTokens: 200, // Allow multi-line suggestions
      });

      if (!response.success || !response.text) {
        return;
      }

      // Parse and display suggestion
      const suggestion = this.parseSuggestion(response.text, textUntilPosition, position);
      if (suggestion) {
        this.displaySuggestion(suggestion);
      }
    } catch (error) {
      logger.debug('Tab completion failed:', { error });
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Build prompt for completion
   */
  private buildCompletionPrompt(context: string, position: Monaco.Position): string {
    let prompt = `You are a code completion assistant. Complete the code starting from the current position.\n\n`;
    prompt += `Previous code:\n${context}\n\n`;
    prompt += `Provide the next 1-5 lines of code that logically continue from this point. Return only the code, no explanations.`;
    return prompt;
  }

  /**
   * Parse suggestion from LLM response
   */
  private parseSuggestion(
    response: string,
    context: string,
    position: Monaco.Position
  ): TabCompletionSuggestion | null {
    if (!this.monaco) {
      return null;
    }

    // Clean up response
    let suggestion = response.trim();
    
    // Remove code block markers
    suggestion = suggestion.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
    
    // Remove explanations
    const lines = suggestion.split('\n');
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('//') && 
             !trimmed.startsWith('#') && 
             !trimmed.toLowerCase().startsWith('here') &&
             !trimmed.toLowerCase().startsWith('this') &&
             trimmed.length > 0;
    });

    suggestion = codeLines.join('\n').trim();

    if (!suggestion || suggestion.length === 0) {
      return null;
    }

    // Create range for suggestion (starts at current position)
    const range: Monaco.IRange = {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    };

    return {
      text: suggestion,
      range,
    };
  }

  /**
   * Display suggestion as ghost text
   */
  private displaySuggestion(suggestion: TabCompletionSuggestion): void {
    if (!this.editor || !this.monaco) {
      return;
    }

    this.currentSuggestion = suggestion;

    // Calculate end position
    const lines = suggestion.text.split('\n');
    const endLine = suggestion.range.startLineNumber + lines.length - 1;
    const endColumn = lines.length === 1
      ? suggestion.range.startColumn + lines[0].length
      : lines[lines.length - 1].length + 1;

    const endRange: Monaco.IRange = {
      startLineNumber: endLine,
      startColumn: endColumn,
      endLineNumber: endLine,
      endColumn: endColumn,
    };

    // Create decoration for ghost text
    const decoration: Monaco.editor.IModelDeltaDecoration = {
      range: {
        startLineNumber: suggestion.range.startLineNumber,
        startColumn: suggestion.range.startColumn,
        endLineNumber: endLine,
        endColumn: endColumn,
      },
      options: {
        after: {
          content: suggestion.text,
          inlineClassName: 'ai-tab-completion-ghost',
        },
        hoverMessage: { value: 'Press Tab to accept, Escape to dismiss' },
      },
    };

    // Apply decoration
    this.suggestionDecoration = this.editor.deltaDecorations(
      this.suggestionDecoration,
      [decoration]
    );
  }

  /**
   * Accept current suggestion
   */
  private acceptSuggestion(): void {
    if (!this.editor || !this.currentSuggestion) {
      return;
    }

    // Insert suggestion text
    this.editor.executeEdits('ai-tab-completion', [{
      range: this.currentSuggestion.range,
      text: this.currentSuggestion.text,
    }]);

    // Clear suggestion
    this.clearSuggestion();
  }

  /**
   * Clear current suggestion
   */
  private clearSuggestion(): void {
    if (!this.editor || this.suggestionDecoration.length === 0) {
      return;
    }

    this.editor.deltaDecorations(this.suggestionDecoration, []);
    this.suggestionDecoration = [];
    this.currentSuggestion = null;
  }

  /**
   * Dispose service
   */
  dispose(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.clearSuggestion();
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

export const aiTabCompletionService = new AITabCompletionService();

