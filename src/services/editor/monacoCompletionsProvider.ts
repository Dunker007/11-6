import type * as Monaco from 'monaco-editor';
import { multiFileContextService } from '../ai/multiFileContextService';
import { useLLMStore } from '../ai/llmStore';

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

    // Only trigger AI completions in specific contexts
    const shouldTriggerAI = 
      context.currentLine.includes('function') ||
      context.currentLine.includes('const') ||
      context.currentLine.includes('//') ||
      context.previousLines.some(line => line.includes('TODO'));

    if (!shouldTriggerAI) {
      return [];
    }

    // Build prompt for AI completion (currently unused - placeholder for future AI integration)
    // const prompt = this.buildAIPrompt(context);
    
    try {
      // In real implementation, would call LLM for suggestions
      // For now, return placeholder
      return [{
        label: '✨ AI Suggestion',
        kind: this.monaco!.languages.CompletionItemKind.Text,
        detail: 'AI-powered completion',
        insertText: '// AI completion would appear here',
        documentation: 'Press Tab to accept',
        range,
      }];
    } catch (error) {
      logger.error('AI completion failed:', { error });
      return [];
    }
  }

  // Removed unused _buildAIPrompt method - can be re-added when AI completion is implemented

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

