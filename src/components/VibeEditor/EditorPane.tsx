/**
 * EditorPane.tsx
 * 
 * Individual editor pane wrapper that contains tabs and a Monaco editor instance.
 */

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useTabStore } from '@/services/editor/tabStore';
import { useProjectStore } from '@/services/project/projectStore';
import { proactiveAgentService } from '@/services/agents/proactiveAgentService';
import { VibeDSTheme } from '@/services/theme/VibeDSEditorTheme';
import { eslintService } from '@/services/codeQuality/eslintService';
import { monacoCompletionsProvider } from '@/services/editor/monacoCompletionsProvider';
import { aiTabCompletionService } from '@/services/ai/aiTabCompletionService';
import { useActivityStore } from '@/services/activity/activityStore';
import TabBar from './TabBar';
import TechIcon from '../Icons/TechIcon';
import { Code } from 'lucide-react';
import '@/styles/EditorPane.css';
import '@/styles/aiTabCompletion.css';

interface EditorPaneProps {
  paneId: string;
  onSplitPane?: (direction: 'horizontal' | 'vertical') => void;
}

function EditorPane({ paneId, onSplitPane }: EditorPaneProps) {
  const { getTabsByPane, activeTabId, getTab, setActiveTab, updateTabContent } = useTabStore();
  const { getFileContent, updateFile } = useProjectStore();
  const { addActivity } = useActivityStore();
  
  const tabs = getTabsByPane(paneId);
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTab) {
      const content = getFileContent(activeTab.path) || '';
      setFileContent(content);
      updateTabContent(activeTab.id, content, false);
    }
  }, [activeTab, getFileContent, updateTabContent]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { closeTab } = useTabStore.getState();
    closeTab(tabId);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeTab && value !== undefined) {
      setFileContent(value);
      updateTabContent(activeTab.id, value, true);
      
      // Trigger proactive code analysis
      proactiveAgentService.triggerCodeAnalysis(value, activeTab.path);
      
      // Clear save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce save
      saveTimeoutRef.current = setTimeout(() => {
        updateFile(activeTab.path, value);
        updateTabContent(activeTab.id, value, false);
        
        const fileName = activeTab.path.split('/').pop() || activeTab.path;
        addActivity('file', 'saved', `Saved ${fileName}`);
      }, 500);
    }
  };

  // Real-time ESLint integration
  useEffect(() => {
    if (!editorRef.current || !activeTab || !fileContent) {
      return;
    }

    if (lintTimeoutRef.current) {
      clearTimeout(lintTimeoutRef.current);
    }

    lintTimeoutRef.current = setTimeout(async () => {
      try {
        const ext = activeTab.path.split('.').pop()?.toLowerCase();
        if (!['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) {
          return;
        }

        const lintResult = await eslintService.lintFile(activeTab.path, fileContent);
        
        if (editorRef.current && lintResult.results.length > 0) {
          const monaco = (window as any).monaco;
          if (monaco) {
            const markers = eslintService.eslintResultsToMonacoMarkers(lintResult.results);
            const model = editorRef.current.getModel();
            if (model) {
              monaco.editor.setModelMarkers(model, 'eslint', markers);
            }
          }
        } else if (editorRef.current) {
          const monaco = (window as any).monaco;
          if (monaco) {
            const model = editorRef.current.getModel();
            if (model) {
              monaco.editor.setModelMarkers(model, 'eslint', []);
            }
          }
        }
      } catch (error) {
        console.debug('ESLint not available:', error);
      }
    }, 500);

    return () => {
      if (lintTimeoutRef.current) {
        clearTimeout(lintTimeoutRef.current);
      }
    };
  }, [fileContent, activeTab]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (lintTimeoutRef.current) {
        clearTimeout(lintTimeoutRef.current);
      }
    };
  }, []);

  if (tabs.length === 0) {
    return (
      <div className="editor-pane empty">
        <div className="editor-placeholder">
          <TechIcon icon={Code} size={48} glow="none" />
          <p>No files open in this pane</p>
        </div>
      </div>
    );
  }

  if (!activeTab) {
    return null;
  }

  return (
    <div className="editor-pane">
      <TabBar
        paneId={paneId}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
      />
      
      <div className="editor-content">
        <Editor
          height="100%"
          language={activeTab.language || 'plaintext'}
          value={fileContent}
          onChange={handleEditorChange}
          onMount={(editor: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
            editorRef.current = editor;
            (window as any).monaco = monaco;
            
            monaco.editor.defineTheme('VibeDSTheme', VibeDSTheme);
            monaco.editor.setTheme('VibeDSTheme');
            
            monacoCompletionsProvider.initialize(monaco);
            aiTabCompletionService.initialize(editor, monaco);
          }}
          theme="VibeDSTheme"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            bracketPairColorization: {
              enabled: true,
            },
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: 'never',
              seedSearchStringFromSelection: 'always',
            },
          }}
        />
      </div>
    </div>
  );
}

export default EditorPane;

