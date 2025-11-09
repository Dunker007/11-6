import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../core/project/projectStore';
import '../styles-new/editor.css';

interface EditorProps {
  projectId: string | null;
}

function CodeEditor(_props: EditorProps) {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('typescript');

  const { activeFile, getFileContent, updateFile, setActiveFile: setStoreActiveFile } = useProjectStore();
  const editorRef = useRef<any>(null);

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
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setContent(value);
      // Debounced save
      const timeoutId = setTimeout(() => {
        updateFile(activeFile, value);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

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
