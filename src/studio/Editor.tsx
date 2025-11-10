import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useProjectStore } from '../core/project/projectStore';
import '../styles-new/editor.css';

interface EditorProps {
  projectId: string | null;
}

function CodeEditor(_props: EditorProps) {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [isEditorReady, setIsEditorReady] = useState(false);

  const { activeFile, getFileContent, updateFile, setActiveFile: setStoreActiveFile } = useProjectStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeFile) {
      const fileContent = getFileContent(activeFile);
      setContent(fileContent || '');
      setLanguage(getLanguageFromFile(activeFile));
      setStoreActiveFile(activeFile);
    }
  }, [activeFile, getFileContent, setStoreActiveFile]);

  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'less': return 'less';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'yaml': case 'yml': return 'yaml';
      case 'xml': return 'xml';
      case 'sql': return 'sql';
      case 'sh': case 'bash': return 'shell';
      case 'dockerfile': return 'dockerfile';
      default: return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setContent(value);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Debounced save
      timeoutRef.current = setTimeout(() => {
        updateFile(activeFile, value);
      }, 1000);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Configure TypeScript/JavaScript IntelliSense
    monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monacoInstance.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monacoInstance.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monacoInstance.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
    });

    // Add editor commands
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      // Format document
      editor.getAction('editor.action.formatDocument')?.run();
    });

    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyO, () => {
      // Organize imports
      editor.getAction('editor.action.organizeImports')?.run();
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="editor-container">
      {activeFile ? (
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showIssues: true,
              showUsers: true,
              showWords: true,
            },
            hover: {
              enabled: true,
              delay: 300,
            },
            parameterHints: {
              enabled: true,
            },
            codeLens: true,
            colorDecorators: true,
            bracketPairColorization: {
              enabled: true,
            },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            folding: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
            matchBrackets: 'always',
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            multiCursorModifier: 'ctrlCmd',
            accessibilitySupport: 'auto',
            contextmenu: true,
            mouseWheelZoom: true,
            dragAndDrop: true,
            links: true,
            lightbulb: {
              enabled: true,
            },
          }}
        />
      ) : (
        <div className="editor-placeholder">
          <div className="placeholder-content">
            <h2>Welcome to Vibed Ed Studio</h2>
            <p>Select a file from the sidebar to start coding</p>
            <p className="hint">💡 Ask Ed for help anytime!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodeEditor;
