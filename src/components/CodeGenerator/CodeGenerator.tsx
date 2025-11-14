import { useState } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { multiFileContextService } from '../../services/ai/multiFileContextService';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import TechIcon from '../Icons/TechIcon';
import {
  Code,
  Sparkles,
  Copy,
  Check,
  FileText,
  Brain,
  Zap,
  LucideIcon,
} from 'lucide-react';
import '../../styles/CodeGenerator.css';

interface GenerationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'component' | 'function' | 'class' | 'api' | 'test' | 'config';
  icon: LucideIcon;
  prompt: string;
}

const GENERATION_TEMPLATES: GenerationTemplate[] = [
  {
    id: 'react-component',
    name: 'React Component',
    description: 'Generate a functional React component with TypeScript',
    category: 'component',
    icon: Code,
    prompt: 'Create a React functional component with TypeScript that',
  },
  {
    id: 'api-endpoint',
    name: 'API Endpoint',
    description: 'Generate a REST API endpoint with validation',
    category: 'api',
    icon: Zap,
    prompt: 'Create a REST API endpoint that',
  },
  {
    id: 'utility-function',
    name: 'Utility Function',
    description: 'Generate a pure utility function with tests',
    category: 'function',
    icon: Brain,
    prompt: 'Create a utility function that',
  },
  {
    id: 'test-suite',
    name: 'Test Suite',
    description: 'Generate comprehensive unit tests',
    category: 'test',
    icon: Check,
    prompt: 'Generate unit tests for',
  },
  {
    id: 'data-model',
    name: 'Data Model',
    description: 'Generate a TypeScript interface/type',
    category: 'class',
    icon: FileText,
    prompt: 'Create a TypeScript interface for',
  },
  {
    id: 'config-file',
    name: 'Configuration',
    description: 'Generate configuration file',
    category: 'config',
    icon: Sparkles,
    prompt: 'Generate configuration for',
  },
];

function CodeGenerator() {
  const { streamGenerate, isLoading } = useLLMStore();
  const { activeProject } = useProjectStore();
  const { addActivity } = useActivityStore();

  const [selectedTemplate, setSelectedTemplate] =
    useState<GenerationTemplate | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    'typescript' | 'javascript' | 'python'
  >('typescript');

  const handleGenerate = async () => {
    if (!selectedTemplate || !userPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedCode('');

    try {
      // Build comprehensive prompt with project context
      let fullPrompt = `${selectedTemplate.prompt} ${userPrompt.trim()}.\n\n`;
      fullPrompt += `Language: ${selectedLanguage}\n`;

      if (additionalContext.trim()) {
        fullPrompt += `Additional requirements: ${additionalContext.trim()}\n`;
      }

      // Add project context if available
      if (activeProject) {
        const context = multiFileContextService.getProjectContext(
          activeProject.id
        );
        if (context) {
          const stats = multiFileContextService.getStats(activeProject.id);
          if (stats) {
            fullPrompt += `\nProject context:\n`;
            fullPrompt += `- Total files: ${stats.totalFiles}\n`;
            const languages = Object.keys(stats.languageDistribution || {});
            if (languages.length > 0) {
              fullPrompt += `- Languages: ${languages.join(', ')}\n`;
            }
          }
        }
      }

      fullPrompt += `\nGenerate clean, production-ready code following best practices. Include:\n`;
      fullPrompt += `- Proper TypeScript types (if TypeScript)\n`;
      fullPrompt += `- JSDoc comments\n`;
      fullPrompt += `- Error handling\n`;
      fullPrompt += `- Input validation where appropriate\n\n`;
      fullPrompt += `Return ONLY the code, no explanations.`;

      // Stream generation
      let code = '';
      for await (const chunk of streamGenerate(fullPrompt)) {
        if (chunk.text) {
          code += chunk.text;
          setGeneratedCode(code);
        }
      }

      // Track activity
      addActivity(
        'code',
        'generated',
        `Generated ${selectedTemplate.name}: ${userPrompt.substring(0, 50)}`
      );
    } catch (error) {
      console.error('Generation failed:', error);
      setGeneratedCode(`// Error: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSelectedTemplate(null);
    setUserPrompt('');
    setAdditionalContext('');
    setGeneratedCode('');
  };

  return (
    <div className="code-generator">
      <div className="generator-header">
        <div className="header-title">
          <TechIcon icon={Code} size={32} glow="cyan" animated={isGenerating} />
          <div>
            <h2>AI Code Generator</h2>
            <p>Generate production-ready code with AI assistance</p>
          </div>
        </div>
      </div>

      {!selectedTemplate ? (
        <div className="template-selection">
          <h3>Choose a Template</h3>
          <div className="templates-grid">
            {GENERATION_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="template-icon">
                  <TechIcon icon={template.icon} size={32} glow="cyan" />
                </div>
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <span className="template-category">{template.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="generator-workspace">
          <div className="workspace-header">
            <div className="selected-template">
              <TechIcon icon={selectedTemplate.icon} size={24} glow="cyan" />
              <div>
                <h3>{selectedTemplate.name}</h3>
                <p>{selectedTemplate.description}</p>
              </div>
            </div>
            <button className="btn-secondary" onClick={handleReset}>
              Change Template
            </button>
          </div>

          <div className="input-section">
            <div className="form-group">
              <label>What do you want to create?</label>
              <input
                type="text"
                className="prompt-input"
                placeholder={`e.g., "handles user authentication with JWT tokens"`}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="form-group">
              <label>Additional Context (Optional)</label>
              <textarea
                className="context-input"
                placeholder="Any specific requirements, constraints, or details..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <div className="form-group">
              <label>Target Language</label>
              <div className="language-selector">
                {(['typescript', 'javascript', 'python'] as const).map(
                  (lang) => (
                    <button
                      key={lang}
                      className={`lang-btn ${selectedLanguage === lang ? 'active' : ''}`}
                      onClick={() => setSelectedLanguage(lang)}
                      disabled={isGenerating}
                    >
                      {lang}
                    </button>
                  )
                )}
              </div>
            </div>

            <button
              className="btn-primary generate-btn"
              onClick={handleGenerate}
              disabled={!userPrompt.trim() || isGenerating || isLoading}
            >
              <TechIcon
                icon={Sparkles}
                size={20}
                glow="cyan"
                animated={isGenerating || isLoading}
              />
              <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
            </button>
          </div>

          {generatedCode && (
            <div className="output-section">
              <div className="output-header">
                <h4>Generated Code</h4>
                <button
                  className="btn-icon"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  <TechIcon
                    icon={copied ? Check : Copy}
                    size={18}
                    glow={copied ? 'cyan' : 'none'}
                  />
                </button>
              </div>
              <div className="code-output">
                <pre>
                  <code className={`language-${selectedLanguage}`}>
                    {generatedCode}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CodeGenerator;