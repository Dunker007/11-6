/**
 * Gemini Studio Panel
 * Configuration panel for Google AI Studio features
 * Provides controls for all Gemini-specific features: safety settings, system instructions,
 * function calling, grounding, and advanced parameters
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  Settings, 
  Shield, 
  Code, 
  Search, 
  Sliders, 
  Save,
  ChevronDown,
  ChevronUp,
  Info,
  X,
} from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { useToast } from '@/components/ui';
import type { GenerateOptions } from '@/types/llm';
import type {
  GeminiSafetyCategory,
  GeminiSafetyThreshold,
  GeminiSafetySetting,
  GeminiTool,
  GeminiFunctionDeclaration,
  GeminiGroundingConfig,
} from '@/types/gemini';
import {
  GeminiSafetyCategory as SafetyCategory,
  GeminiSafetyThreshold as SafetyThreshold,
} from '@/types/gemini';
import '@/styles/GeminiStudio.css';

interface GeminiStudioPanelProps {
  onConfigChange?: (config: Partial<GenerateOptions>) => void;
  initialConfig?: Partial<GenerateOptions>;
  onClose?: () => void;
}

const SAFETY_CATEGORY_LABELS: Record<GeminiSafetyCategory, string> = {
  [SafetyCategory.HARASSMENT]: 'Harassment',
  [SafetyCategory.HATE_SPEECH]: 'Hate Speech',
  [SafetyCategory.SEXUALLY_EXPLICIT]: 'Sexually Explicit',
  [SafetyCategory.DANGEROUS_CONTENT]: 'Dangerous Content',
};

const SAFETY_THRESHOLD_LABELS: Record<GeminiSafetyThreshold, string> = {
  [SafetyThreshold.BLOCK_NONE]: 'Block None',
  [SafetyThreshold.BLOCK_ONLY_HIGH]: 'Block Only High',
  [SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE]: 'Block Medium & Above',
  [SafetyThreshold.BLOCK_LOW_AND_ABOVE]: 'Block Low & Above',
};

const SYSTEM_INSTRUCTION_TEMPLATES = [
  { label: 'Code Assistant', value: 'You are a helpful coding assistant. Provide clear, concise code explanations and examples.' },
  { label: 'Creative Writer', value: 'You are a creative writing assistant. Help users write engaging, original content.' },
  { label: 'Technical Expert', value: 'You are a technical expert. Provide detailed, accurate technical information.' },
  { label: 'General Assistant', value: 'You are a helpful AI assistant. Be friendly, informative, and concise.' },
];

function GeminiStudioPanel({ 
  onConfigChange, 
  initialConfig,
  onClose 
}: GeminiStudioPanelProps) {
  const { models } = useLLMStore();
  const { showToast } = useToast();
  
  // Get Gemini models
  const geminiModels = useMemo(() => {
    return models.filter(m => m.provider === 'gemini');
  }, [models]);

  // State for all configuration options
  const [selectedModel, setSelectedModel] = useState<string>(
    initialConfig?.model || geminiModels[0]?.id || 'gemini-2.0-flash-exp'
  );
  const [temperature, setTemperature] = useState<number>(
    initialConfig?.temperature ?? 0.91
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    initialConfig?.maxTokens ?? 2048
  );
  const [topP, setTopP] = useState<number | undefined>(initialConfig?.topP);
  const [topK, setTopK] = useState<number | undefined>(initialConfig?.topK);
  const [candidateCount, setCandidateCount] = useState<number | undefined>(
    initialConfig?.candidateCount
  );
  const [responseMimeType, setResponseMimeType] = useState<string>(
    initialConfig?.responseMimeType || 'text/plain'
  );
  const [stopSequences, setStopSequences] = useState<string[]>(
    initialConfig?.stopSequences || []
  );
  
  // Safety settings
  const [safetySettings, setSafetySettings] = useState<GeminiSafetySetting[]>(
    initialConfig?.safetySettings || [
      { category: SafetyCategory.HARASSMENT, threshold: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: SafetyCategory.HATE_SPEECH, threshold: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: SafetyCategory.SEXUALLY_EXPLICIT, threshold: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: SafetyCategory.DANGEROUS_CONTENT, threshold: SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ]
  );

  // System instruction
  const [systemInstruction, setSystemInstruction] = useState<string>(
    typeof initialConfig?.systemInstruction === 'string' 
      ? initialConfig.systemInstruction 
      : initialConfig?.systemInstruction?.parts?.[0]?.text || ''
  );
  const [showSystemTemplates, setShowSystemTemplates] = useState(false);

  // Function calling
  const [tools, setTools] = useState<GeminiTool[]>(initialConfig?.tools || []);
  const [showFunctionEditor, setShowFunctionEditor] = useState(false);
  const [functionName, setFunctionName] = useState('');
  const [functionDescription, setFunctionDescription] = useState('');
  const [functionSchema, setFunctionSchema] = useState('');

  // Grounding
  const [groundingEnabled, setGroundingEnabled] = useState<boolean>(
    !!initialConfig?.groundingConfig
  );
  const [groundingMode, setGroundingMode] = useState<'MODE_DYNAMIC' | 'MODE_STATIC'>('MODE_DYNAMIC');

  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['model', 'generation'])
  );

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const updateSafetySetting = useCallback((
    category: GeminiSafetyCategory,
    threshold: GeminiSafetyThreshold
  ) => {
    setSafetySettings(prev => {
      const updated = prev.filter(s => s.category !== category);
      updated.push({ category, threshold });
      return updated;
    });
  }, []);

  const addFunction = useCallback(() => {
    if (!functionName.trim()) {
      showToast({
        variant: 'error',
        title: 'Function name required',
        message: 'Please enter a function name',
      });
      return;
    }

    try {
      const schema = functionSchema.trim() 
        ? JSON.parse(functionSchema) 
        : { type: 'object', properties: {} };

      const newFunction: GeminiFunctionDeclaration = {
        name: functionName,
        description: functionDescription || undefined,
        parameters: schema,
      };

      setTools(prev => {
        const updated = [...prev];
        if (updated.length === 0) {
          updated.push({ functionDeclarations: [] });
        }
        updated[0].functionDeclarations = [
          ...(updated[0].functionDeclarations || []),
          newFunction,
        ];
        return updated;
      });

      // Reset form
      setFunctionName('');
      setFunctionDescription('');
      setFunctionSchema('');
      setShowFunctionEditor(false);

      showToast({
        variant: 'success',
        title: 'Function added',
        message: `Function "${functionName}" has been added`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Invalid JSON',
        message: 'Function schema must be valid JSON',
      });
    }
  }, [functionName, functionDescription, functionSchema, showToast]);

  const removeFunction = useCallback((index: number) => {
    setTools(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[0].functionDeclarations) {
        updated[0].functionDeclarations = updated[0].functionDeclarations.filter(
          (_, i) => i !== index
        );
        if (updated[0].functionDeclarations.length === 0) {
          return [];
        }
      }
      return updated;
    });
  }, []);

  const applyConfig = useCallback(() => {
    const config: Partial<GenerateOptions> = {
      model: selectedModel,
      temperature,
      maxTokens,
      topP: topP !== undefined ? topP : undefined,
      topK: topK !== undefined ? topK : undefined,
      candidateCount: candidateCount !== undefined ? candidateCount : undefined,
      responseMimeType: responseMimeType !== 'text/plain' ? responseMimeType : undefined,
      stopSequences: stopSequences.length > 0 ? stopSequences : undefined,
      safetySettings: safetySettings.length > 0 ? safetySettings : undefined,
      systemInstruction: systemInstruction.trim() || undefined,
      tools: tools.length > 0 ? tools : undefined,
      groundingConfig: groundingEnabled
        ? {
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: groundingMode,
              },
            },
          }
        : undefined,
    };

    onConfigChange?.(config);
    showToast({
      variant: 'success',
      title: 'Configuration saved',
      message: 'Gemini Studio settings have been applied',
    });
  }, [
    selectedModel,
    temperature,
    maxTokens,
    topP,
    topK,
    candidateCount,
    responseMimeType,
    stopSequences,
    safetySettings,
    systemInstruction,
    tools,
    groundingEnabled,
    groundingMode,
    onConfigChange,
    showToast,
  ]);

  return (
    <div className="gemini-studio-panel">
      <div className="gemini-studio-header">
        <div className="gemini-studio-title">
          <Settings className="gemini-studio-icon" />
          <h2>Gemini Studio</h2>
        </div>
        {onClose && (
          <button className="gemini-studio-close" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      <div className="gemini-studio-content">
        {/* Model Selection */}
        <div className="gemini-studio-section">
          <button
            className="gemini-studio-section-header"
            onClick={() => toggleSection('model')}
          >
            <span>Model Selection</span>
            {expandedSections.has('model') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('model') && (
            <div className="gemini-studio-section-content">
              <select
                className="gemini-studio-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {geminiModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.capabilities?.includes('function-calling') && '🔧'}
                    {model.capabilities?.includes('vision') && '👁️'}
                    {model.capabilities?.includes('grounding') && '🔍'}
                  </option>
                ))}
              </select>
              {geminiModels.find(m => m.id === selectedModel)?.description && (
                <p className="gemini-studio-description">
                  {geminiModels.find(m => m.id === selectedModel)?.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Generation Parameters */}
        <div className="gemini-studio-section">
          <button
            className="gemini-studio-section-header"
            onClick={() => toggleSection('generation')}
          >
            <Sliders className="gemini-studio-section-icon" size={18} />
            <span>Generation Parameters</span>
            {expandedSections.has('generation') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('generation') && (
            <div className="gemini-studio-section-content">
              <div className="gemini-studio-param">
                <label>Temperature: {temperature.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
              </div>
              <div className="gemini-studio-param">
                <label>Max Tokens: {maxTokens}</label>
                <input
                  type="number"
                  min="1"
                  max="8192"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                />
              </div>
              <div className="gemini-studio-param">
                <label>Top P: {topP !== undefined ? topP.toFixed(2) : 'Default'}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={topP ?? 0.95}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                />
                <button
                  className="gemini-studio-reset"
                  onClick={() => setTopP(undefined)}
                >
                  Reset
                </button>
              </div>
              <div className="gemini-studio-param">
                <label>Top K: {topK !== undefined ? topK : 'Default'}</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={topK ?? 40}
                  onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                />
                <button
                  className="gemini-studio-reset"
                  onClick={() => setTopK(undefined)}
                >
                  Reset
                </button>
              </div>
              <div className="gemini-studio-param">
                <label>Response Format</label>
                <select
                  className="gemini-studio-select"
                  value={responseMimeType}
                  onChange={(e) => setResponseMimeType(e.target.value)}
                >
                  <option value="text/plain">Text</option>
                  <option value="application/json">JSON</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Safety Settings */}
        <div className="gemini-studio-section">
          <button
            className="gemini-studio-section-header"
            onClick={() => toggleSection('safety')}
          >
            <Shield className="gemini-studio-section-icon" size={18} />
            <span>Safety Settings</span>
            {expandedSections.has('safety') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('safety') && (
            <div className="gemini-studio-section-content">
              {Object.values(SafetyCategory).map(category => {
                const setting = safetySettings.find(s => s.category === category);
                return (
                  <div key={category} className="gemini-studio-param">
                    <label>{SAFETY_CATEGORY_LABELS[category]}</label>
                    <select
                      className="gemini-studio-select"
                      value={setting?.threshold || SafetyThreshold.BLOCK_MEDIUM_AND_ABOVE}
                      onChange={(e) =>
                        updateSafetySetting(category, e.target.value as GeminiSafetyThreshold)
                      }
                    >
                      {Object.values(SafetyThreshold).map(threshold => (
                        <option key={threshold} value={threshold}>
                          {SAFETY_THRESHOLD_LABELS[threshold]}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* System Instruction */}
        <div className="gemini-studio-section">
          <button
            className="gemini-studio-section-header"
            onClick={() => toggleSection('system')}
          >
            <Info className="gemini-studio-section-icon" size={18} />
            <span>System Instruction</span>
            {expandedSections.has('system') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('system') && (
            <div className="gemini-studio-section-content">
              <div className="gemini-studio-templates">
                <button
                  className="gemini-studio-template-btn"
                  onClick={() => setShowSystemTemplates(!showSystemTemplates)}
                >
                  Load Template
                </button>
                {showSystemTemplates && (
                  <div className="gemini-studio-template-list">
                    {SYSTEM_INSTRUCTION_TEMPLATES.map(template => (
                      <button
                        key={template.label}
                        className="gemini-studio-template-item"
                        onClick={() => {
                          setSystemInstruction(template.value);
                          setShowSystemTemplates(false);
                        }}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea
                className="gemini-studio-textarea"
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="Enter system instruction..."
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Function Calling */}
        <div className="gemini-studio-section">
          <button
            className="gemini-studio-section-header"
            onClick={() => toggleSection('functions')}
          >
            <Code className="gemini-studio-section-icon" size={18} />
            <span>Function Calling</span>
            {expandedSections.has('functions') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('functions') && (
            <div className="gemini-studio-section-content">
              {tools.length > 0 && tools[0].functionDeclarations && (
                <div className="gemini-studio-functions-list">
                  {tools[0].functionDeclarations.map((func, index) => (
                    <div key={index} className="gemini-studio-function-item">
                      <span>{func.name}</span>
                      <button
                        className="gemini-studio-remove-btn"
                        onClick={() => removeFunction(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showFunctionEditor ? (
                <div className="gemini-studio-function-editor">
                  <input
                    className="gemini-studio-input"
                    placeholder="Function name"
                    value={functionName}
                    onChange={(e) => setFunctionName(e.target.value)}
                  />
                  <input
                    className="gemini-studio-input"
                    placeholder="Description (optional)"
                    value={functionDescription}
                    onChange={(e) => setFunctionDescription(e.target.value)}
                  />
                  <textarea
                    className="gemini-studio-textarea"
                    placeholder='JSON Schema (e.g., {"type":"object","properties":{"query":{"type":"string"}}})'
                    value={functionSchema}
                    onChange={(e) => setFunctionSchema(e.target.value)}
                    rows={6}
                  />
                  <div className="gemini-studio-function-actions">
                    <button className="gemini-studio-btn-primary" onClick={addFunction}>
                      Add Function
                    </button>
                    <button
                      className="gemini-studio-btn-secondary"
                      onClick={() => {
                        setShowFunctionEditor(false);
                        setFunctionName('');
                        setFunctionDescription('');
                        setFunctionSchema('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="gemini-studio-btn-secondary"
                  onClick={() => setShowFunctionEditor(true)}
                >
                  + Add Function
                </button>
              )}
            </div>
          )}
        </div>

        {/* Grounding */}
        <div className="gemini-studio-section">
          <button
            className="gemini-studio-section-header"
            onClick={() => toggleSection('grounding')}
          >
            <Search className="gemini-studio-section-icon" size={18} />
            <span>Google Search Grounding</span>
            {expandedSections.has('grounding') ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
          {expandedSections.has('grounding') && (
            <div className="gemini-studio-section-content">
              <div className="gemini-studio-param">
                <label>
                  <input
                    type="checkbox"
                    checked={groundingEnabled}
                    onChange={(e) => setGroundingEnabled(e.target.checked)}
                  />
                  Enable Google Search Grounding
                </label>
              </div>
              {groundingEnabled && (
                <div className="gemini-studio-param">
                  <label>Grounding Mode</label>
                  <select
                    className="gemini-studio-select"
                    value={groundingMode}
                    onChange={(e) =>
                      setGroundingMode(e.target.value as 'MODE_DYNAMIC' | 'MODE_STATIC')
                    }
                  >
                    <option value="MODE_DYNAMIC">Dynamic</option>
                    <option value="MODE_STATIC">Static</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="gemini-studio-footer">
        <button className="gemini-studio-btn-primary" onClick={applyConfig}>
          <Save size={18} />
          Apply Configuration
        </button>
      </div>
    </div>
  );
}

export default GeminiStudioPanel;

