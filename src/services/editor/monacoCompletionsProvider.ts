import type * as Monaco from 'monaco-editor';
import { multiFileContextService } from '../ai/multiFileContextService';
import { useLLMStore } from '../ai/llmStore';
import { llmRouter } from '../ai/router';
import { logger } from '../logging/loggerService';

export interface CompletionContext {
  projectId: string;
  filePath: string;
  currentLine: string;
  previousLines: string[];
  cursorPosition: number;
  fileLanguage: string;
}

export interface SmartCompletion {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
  sortText?: string;
  filterText?: string;
  range?: Monaco.IRange | Monaco.languages.CompletionItemRanges;
}

class MonacoCompletionsProvider {
  private monaco: typeof Monaco | null = null;
  private disposables: Monaco.IDisposable[] = [];

  /**
   * Initialize the completions provider
   */
  initialize(monaco: typeof Monaco): void {
    this.monaco = monaco;
    this.registerCompletionProviders();
  }

  /**
   * Register completion providers for all supported languages
   */
  private registerCompletionProviders(): void {
    if (!this.monaco) return;

    const languages = ['typescript', 'javascript', 'python', 'html', 'css', 'json'];

    languages.forEach(language => {
      const disposable = this.monaco!.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', ':', '<', '"', "'", '/', '@'],
        provideCompletionItems: async (model, position) => {
          return this.provideContextualCompletions(model, position, language);
        },
      });
      this.disposables.push(disposable);
    });
  }

  /**
   * Provide contextual completions based on project knowledge
   */
  private async provideContextualCompletions(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
    language: string
  ): Promise<Monaco.languages.CompletionList> {
    if (!this.monaco) {
      return { suggestions: [] };
    }

    const suggestions: Monaco.languages.CompletionItem[] = [];

    // Get current context
    const context = this.extractContext(model, position);
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    // 1. Import completions
    if (context.currentLine.trim().startsWith('import')) {
      const importSuggestions = await this.getImportCompletions(context, range);
      suggestions.push(...importSuggestions);
    }

    // 2. Function/method completions
    if (context.currentLine.includes('.')) {
      const memberSuggestions = await this.getMemberCompletions(context, range);
      suggestions.push(...memberSuggestions);
    }

    // 3. Symbol completions from project
    const symbolSuggestions = await this.getSymbolCompletions(context, range);
    suggestions.push(...symbolSuggestions);

    // 4. Snippet completions
    const snippetSuggestions = this.getSnippetCompletions(language, context, range);
    suggestions.push(...snippetSuggestions);

    // 5. AI-powered completions (if LLM available)
    const aiSuggestions = await this.getAICompletions(context, range);
    suggestions.push(...aiSuggestions);

    return { suggestions };
  }

  /**
   * Extract context from current editor state
   */
  private extractContext(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position
  ): CompletionContext {
    const currentLine = model.getLineContent(position.lineNumber);
    const previousLines: string[] = [];
    
    // Get previous 10 lines for context
    for (let i = Math.max(1, position.lineNumber - 10); i < position.lineNumber; i++) {
      previousLines.push(model.getLineContent(i));
    }

    return {
      projectId: '', // Would be set from active project
      filePath: model.uri.path,
      currentLine: currentLine.substring(0, position.column - 1),
      previousLines,
      cursorPosition: position.column - 1,
      fileLanguage: model.getLanguageId(),
    };
  }

  /**
   * Get import completions from project files
   */
  private async getImportCompletions(
    context: CompletionContext,
    range: Monaco.IRange | Monaco.languages.CompletionItemRanges
  ): Promise<Monaco.languages.CompletionItem[]> {
    if (!this.monaco || !context.projectId) return [];

    const projectContext = multiFileContextService.getProjectContext(context.projectId);
    if (!projectContext) return [];

    const suggestions: Monaco.languages.CompletionItem[] = [];

    // Suggest files and exports from project
    projectContext.files.forEach((fileContext, filePath) => {
      // Don't suggest current file
      if (filePath === context.filePath) return;

      // Suggest exports
      fileContext.exports.forEach(exportName => {
        suggestions.push({
          label: exportName,
          kind: this.monaco!.languages.CompletionItemKind.Function,
          detail: `from ${filePath}`,
          insertText: exportName,
          range,
        });
      });

      // Suggest file path
      const relativePath = this.getRelativePath(context.filePath, filePath);
      suggestions.push({
        label: relativePath,
        kind: this.monaco!.languages.CompletionItemKind.File,
        detail: 'Import from file',
        insertText: `'${relativePath}'`,
        range,
      });
    });

    return suggestions;
  }

  /**
   * Get member completions (methods, properties)
   */
  private async getMemberCompletions(
    context: CompletionContext,
    range: Monaco.IRange | Monaco.languages.CompletionItemRanges
  ): Promise<Monaco.languages.CompletionItem[]> {
    if (!this.monaco) return [];

    const suggestions: Monaco.languages.CompletionItem[] = [];
    
    // Extract object/variable name before the dot
    const match = context.currentLine.match(/(\w+)\.$/);
    if (!match) return [];

    const objectName = match[1];

    // In a real implementation, would analyze types and provide accurate suggestions
    // For now, provide common methods based on language
    const commonMethods: Record<string, string[]> = {
      typescript: ['map', 'filter', 'reduce', 'forEach', 'find', 'includes', 'length'],
      javascript: ['map', 'filter', 'reduce', 'forEach', 'find', 'includes', 'length'],
      python: ['append', 'extend', 'insert', 'remove', 'pop', 'index', 'count'],
    };

    const methods = commonMethods[context.fileLanguage] || [];
    methods.forEach(method => {
      suggestions.push({
        label: method,
        kind: this.monaco!.languages.CompletionItemKind.Method,
        detail: `${objectName}.${method}`,
        insertText: method,
        range,
      });
    });

    return suggestions;
  }

  /**
   * Get symbol completions from project
   */
  private async getSymbolCompletions(
    context: CompletionContext,
    range: Monaco.IRange | Monaco.languages.CompletionItemRanges
  ): Promise<Monaco.languages.CompletionItem[]> {
    if (!this.monaco || !context.projectId) return [];

    const projectContext = multiFileContextService.getProjectContext(context.projectId);
    if (!projectContext) return [];

    const suggestions: Monaco.languages.CompletionItem[] = [];

    // Get related files
    const relatedFiles = multiFileContextService.getRelatedFiles(
      context.projectId,
      context.filePath,
      2
    );

    relatedFiles.forEach(filePath => {
      const fileContext = projectContext.files.get(filePath);
      if (!fileContext) return;

      // Add functions
      fileContext.functions.forEach(funcName => {
        suggestions.push({
          label: funcName,
          kind: this.monaco!.languages.CompletionItemKind.Function,
          detail: `from ${filePath}`,
          insertText: funcName,
          range,
        });
      });

      // Add classes
      fileContext.classes.forEach(className => {
        suggestions.push({
          label: className,
          kind: this.monaco!.languages.CompletionItemKind.Class,
          detail: `from ${filePath}`,
          insertText: className,
          range,
        });
      });
    });

    return suggestions;
  }

  /**
   * Get snippet completions
   */
  private getSnippetCompletions(
    language: string,
    _context: CompletionContext,
    range: Monaco.IRange | Monaco.languages.CompletionItemRanges
  ): Monaco.languages.CompletionItem[] {
    if (!this.monaco) return [];

    const snippets: Record<string, Array<{
      label: string;
      insertText: string;
      detail: string;
    }>> = {
      typescript: [
        {
          label: 'function',
          insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}',
          detail: 'Function declaration',
        },
        {
          label: 'const',
          insertText: 'const ${1:name} = ${2:value};',
          detail: 'Const declaration',
        },
        {
          label: 'if',
          insertText: 'if (${1:condition}) {\n\t$0\n}',
          detail: 'If statement',
        },
        {
          label: 'for',
          insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t$0\n}',
          detail: 'For loop',
        },
        {
          label: 'try',
          insertText: 'try {\n\t$0\n} catch (error) {\n\tlogger.error(error);\n}',
          detail: 'Try-catch block',
        },
      ],
      python: [
        {
          label: 'def',
          insertText: 'def ${1:name}(${2:params}):\n\t$0',
          detail: 'Function definition',
        },
        {
          label: 'class',
          insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:params}):\n\t\t$0',
          detail: 'Class definition',
        },
        {
          label: 'if',
          insertText: 'if ${1:condition}:\n\t$0',
          detail: 'If statement',
        },
        {
          label: 'for',
          insertText: 'for ${1:item} in ${2:iterable}:\n\t$0',
          detail: 'For loop',
        },
      ],
    };

    const languageSnippets = snippets[language] || [];
    return languageSnippets.map(snippet => ({
      label: snippet.label,
      kind: this.monaco!.languages.CompletionItemKind.Snippet,
      detail: snippet.detail,
      insertText: snippet.insertText,
      insertTextRules: this.monaco!.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    }));
  }

  /**
   * Get AI-powered completions
   */
  private async getAICompletions(
    context: CompletionContext,
    range: Monaco.IRange | Monaco.languages.CompletionItemRanges
  ): Promise<Monaco.languages.CompletionItem[]> {
    if (!this.monaco) return [];

    // Check if LLM is available
    const llmStore = useLLMStore.getState();
    if (!llmStore.availableProviders || llmStore.availableProviders.length === 0) {
      return [];
    }

    // Only trigger AI completions in specific contexts to avoid excessive API calls
    const shouldTriggerAI = 
      context.currentLine.trim().length > 3 && // At least some context
      (context.currentLine.includes('function') ||
       context.currentLine.includes('const') ||
       context.currentLine.includes('let') ||
       context.currentLine.includes('var') ||
       context.currentLine.includes('if') ||
       context.currentLine.includes('for') ||
       context.currentLine.includes('while') ||
       context.previousLines.length > 2); // Has some context

    if (!shouldTriggerAI) {
      return [];
    }

    try {
      // Build prompt for AI completion
      const prompt = this.buildAIPrompt(context);
      
      // Get AI suggestion with low temperature for more deterministic completions
      const response = await llmRouter.generate(prompt, {
        temperature: 0.3, // Lower temperature for code completion
        maxTokens: 100, // Limit token count for completions
      });

      if (!response.success || !response.text) {
        return [];
      }

      // Parse the completion
      const completion = this.parseAICompletion(response.text, context);
      
      if (!completion || completion.trim().length === 0) {
        return [];
      }

      // Return AI completion suggestion
      return [{
        label: '✨ AI: ' + completion.substring(0, 30) + (completion.length > 30 ? '...' : ''),
        kind: this.monaco!.languages.CompletionItemKind.Snippet,
        detail: 'AI-powered code completion',
        insertText: completion,
        documentation: 'AI-generated code suggestion based on context',
        range,
        sortText: '0', // Prioritize AI suggestions
        preselect: false,
      }];
    } catch (error) {
      // Silently fail - don't block editor if AI is unavailable
      logger.debug('AI completion failed:', { error });
      return [];
    }
  }

  /**
   * Build prompt for AI completion
   */
  private buildAIPrompt(context: CompletionContext): string {
    const previousContext = context.previousLines.slice(-10).join('\n');
    const currentLinePrefix = context.currentLine.trim();
    
    // Build context-aware prompt
    let prompt = `You are a code completion assistant. Complete the next line of code based on the context.\n\n`;
    
    if (previousContext) {
      prompt += `Previous code:\n${previousContext}\n\n`;
    }
    
    prompt += `Current line (incomplete): ${currentLinePrefix}\n\n`;
    prompt += `Provide only the completion for the current line. Do not repeat the existing code. Return only the code that should be inserted, without explanations.`;
    
    return prompt;
  }

  /**
   * Parse AI completion response
   */
  private parseAICompletion(response: string, context: CompletionContext): string {
    // Clean up the response
    let completion = response.trim();
    
    // Remove code block markers if present
    completion = completion.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
    
    // Remove explanations or comments that might be in the response
    const lines = completion.split('\n');
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      // Filter out lines that look like explanations
      return !trimmed.startsWith('//') && 
             !trimmed.startsWith('#') && 
             !trimmed.toLowerCase().startsWith('here') &&
             !trimmed.toLowerCase().startsWith('this') &&
             trimmed.length > 0;
    });
    
    completion = codeLines.join('\n').trim();
    
    // If we have multiple lines, take the first meaningful one
    if (completion.includes('\n')) {
      const firstLine = completion.split('\n')[0].trim();
      // Only use first line if it's a complete statement
      if (firstLine.endsWith(';') || firstLine.endsWith('{') || firstLine.endsWith('}')) {
        completion = firstLine;
      }
    }
    
    // Remove the prefix that's already in the current line
    const currentPrefix = context.currentLine.trim();
    if (completion.startsWith(currentPrefix)) {
      completion = completion.substring(currentPrefix.length).trim();
    }
    
    return completion;
  }

  /**
   * Get relative path between two files
   */
  private getRelativePath(from: string, to: string): string {
    const fromParts = from.split('/');
    const toParts = to.split('/');

    // Remove filename from 'from'
    fromParts.pop();

    // Find common base
    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    // Build relative path
    const upCount = fromParts.length - commonLength;
    const upPath = '../'.repeat(upCount);
    const downPath = toParts.slice(commonLength).join('/');

    return (upPath + downPath) || './';
  }

  /**
   * Dispose all registered providers
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

export const monacoCompletionsProvider = new MonacoCompletionsProvider();

