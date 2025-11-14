/**
 * AIAssistant.tsx
 * 
 * PURPOSE:
 * Main AI chat assistant component (Vibed Ed). Provides conversational interface for AI-powered
 * coding assistance with context awareness, streaming responses, function calling support, and
 * conversation memory. Integrates with multiple AI services for intelligent code help.
 * 
 * ARCHITECTURE:
 * React component that orchestrates multiple services:
 * - useLLMStore: LLM generation and model management
 * - useProjectStore: Active project and file context
 * - projectKnowledgeService: Project context for AI prompts
 * - multiFileContextService: Multi-file context analysis
 * - agentMemoryService: Conversation persistence
 * - useLLMOptimizerStore: Optimization priority for temperature
 * 
 * Features:
 * - Streaming text responses
 * - Function call handling (Gemini)
 * - Project context awareness
 * - Conversation memory
 * - Quick action buttons
 * - Proactive suggestions
 * - Gemini-specific settings (safety, system instructions, tools)
 * 
 * CURRENT STATUS:
 * ✅ Full chat interface with streaming
 * ✅ Function call support (Gemini)
 * ✅ Dynamic temperature based on priority
 * ✅ Project context integration
 * ✅ Conversation memory
 * ✅ Quick actions (Explain, Refactor, Fix, Generate Tests)
 * ✅ Proactive suggestions
 * ✅ Gemini settings panel
 * 
 * DEPENDENCIES:
 * - useLLMStore: LLM generation
 * - useProjectStore: Project context
 * - projectKnowledgeService: Project knowledge
 * - multiFileContextService: File context
 * - agentMemoryService: Conversation memory
 * - useLLMOptimizerStore: Optimization settings
 * - getTemperatureForPriority: Temperature mapping
 * - EdAvatar: Agent avatar component
 * - GeminiFunctionCalls: Function call display
 * 
 * STATE MANAGEMENT:
 * - Local state: messages, input, streaming status, Gemini settings
 * - Uses multiple Zustand stores for global state
 * - Conversation ID for memory persistence
 * 
 * PERFORMANCE:
 * - Streaming doesn't block UI
 * - Memoized Gemini active check
 * - Efficient message updates
 * - Auto-scroll to latest message
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import AIAssistant from '@/components/AIAssistant/AIAssistant';
 * 
 * function App() {
 *   return <AIAssistant />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmStore.ts: LLM generation
 * - src/services/ai/projectKnowledgeService.ts: Project context
 * - src/components/Agents/EdAvatar.tsx: Avatar component
 * - src/components/LLMOptimizer/GeminiFunctionCalls.tsx: Function call UI
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Code block syntax highlighting
 * - Message editing
 * - Conversation export
 * - Multi-model conversations
 * - Voice input/output
 */
import { useState, useRef, useEffect, useMemo } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { useProjectStore } from '../../services/project/projectStore';
import { projectKnowledgeService } from '../../services/ai/projectKnowledgeService';
import { multiFileContextService } from '../../services/ai/multiFileContextService';
import { useAgentStore } from '../../services/agents/agentStore';
import { agentMemoryService } from '../../services/agents/agentMemoryService';
import { useAPIKeyStore } from '../../services/apiKeys/apiKeyStore';
import { useLLMOptimizerStore } from '../../services/ai/llmOptimizerStore';
import { getTemperatureForPriority } from '../../utils/llmConfig';
import { detectTaskType } from '@/utils/taskDetector';
import { imageToBase64 } from '@/utils/imageUtils';
import { errorLogger } from '@/services/errors/errorLogger';
import { suggestFix } from '@/utils/errorHelpers';
import { logSlowOperation } from '@/utils/performance';
import EdAvatar from '../Agents/EdAvatar';
import TechIcon from '../Icons/TechIcon';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Code,
  Lightbulb,
  Settings,
  ChevronDown,
  ChevronUp,
  Paperclip,
  XCircle,
} from 'lucide-react';
import { Button, Textarea } from '../ui';
import GeminiFunctionCalls from '../LLMOptimizer/GeminiFunctionCalls';
import type { GeminiSafetySetting, GeminiTool, GeminiFunctionCall, GeminiContent } from '../../types/gemini';
import type { GenerateOptions, TaskType } from '../../types/llm';
import '../../styles/AIAssistant.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AIAssistant() {
  const { streamGenerate, isLoading, activeModel, models } = useLLMStore();
  const { activeProject, getFileContent, activeFile } = useProjectStore();
  const { setEdStatus } = useAgentStore();
  const { keys } = useAPIKeyStore();
  const priority = useLLMOptimizerStore((state) => state.priority);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hey there! I'm Vibed Ed, your coding buddy. I'm here to help you build awesome stuff - write code, explain functions, refactor, debug, whatever you need. Let's keep it chill and get things done. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);
  const [showGeminiSettings, setShowGeminiSettings] = useState(false);
  const [geminiSafetySettings, _setGeminiSafetySettings] = useState<GeminiSafetySetting[]>([]);
  const [geminiSystemInstruction, setGeminiSystemInstruction] = useState<string>('');
  const [geminiTools, _setGeminiTools] = useState<GeminiTool[]>([]);
  const [lastFunctionCalls, setLastFunctionCalls] = useState<GeminiFunctionCall[]>([]);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if Gemini is available and active
  const isGeminiActive = useMemo(() => {
    return activeModel?.provider === 'gemini' && 
           models.some(m => m.provider === 'gemini' && m.isAvailable) &&
           keys.some(k => k.provider === 'gemini' && k.isValid);
  }, [activeModel, models, keys]);

  // Load conversation from memory on mount
  useEffect(() => {
    const loadConversation = async () => {
      if (activeProject) {
        try {
          const conversations = await agentMemoryService.searchConversations({
            agent: 'vibed-ed',
            projectId: activeProject.id,
            limit: 1,
          });
          
          if (conversations.length > 0) {
            const conv = conversations[0];
            setConversationId(conv.id);
            setMessages(conv.messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            })));
          } else {
            // Create new conversation
            const newConv = await agentMemoryService.createConversation('vibed-ed', activeProject.id);
            setConversationId(newConv.id);
          }
        } catch (error) {
          console.error('Failed to load conversation:', error);
          errorLogger.logFromError(error as Error, {
            category: 'ai',
            source: 'AIAssistant.loadConversation',
            message: 'Failed to load or create conversation',
          });
        }
      }
    };
    
    loadConversation();
  }, [activeProject?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!attachedImage) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(attachedImage);
  }, [attachedImage]);

  // Generate proactive suggestions based on project state
  useEffect(() => {
    if (!activeProject) {
      setProactiveSuggestions([
        "Create a new project to get started",
        "Open an existing project from disk",
      ]);
      return;
    }

    const suggestions: string[] = [];
    const knowledge = projectKnowledgeService.getProjectKnowledge(activeProject.id);
    const deepContext = multiFileContextService.getProjectContext(activeProject.id);

    if (knowledge) {
      if (!knowledge.structure.hasTests) {
        suggestions.push("Add unit tests for better code quality");
      }
      if (!knowledge.structure.hasDocs) {
        suggestions.push("Create documentation for your project");
      }
      if (knowledge.structure.entryPoints.length === 0) {
        suggestions.push("Set up an entry point file (index.ts, main.ts, etc.)");
      }
    }

    if (deepContext) {
      const todos = Array.from(deepContext.files.values())
        .reduce((sum, file) => sum + file.todoCount, 0);
      if (todos > 0) {
        suggestions.push(`Review ${todos} TODO/FIXME comments in your code`);
      }

      const hotspots = Array.from(deepContext.dependentsGraph.entries())
        .filter(([_, dependents]) => dependents.size > 5)
        .map(([path]) => path);
      if (hotspots.length > 0) {
        suggestions.push(`Consider refactoring ${hotspots.length} highly-coupled files`);
      }
    }

    if (activeFile) {
      const relatedFiles = deepContext 
        ? multiFileContextService.getRelatedFiles(activeProject.id, activeFile, 1)
        : [];
      if (relatedFiles.length > 0) {
        suggestions.push(`Review ${relatedFiles.length} related files for context`);
      }
    }

    setProactiveSuggestions(suggestions.slice(0, 3));
  }, [activeProject, activeFile]);

  const handleImageAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAttachedImage(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading || isStreaming) return;

    // If there's an image but no text, use a default prompt.
    const userMessageContent =
      input.trim() === '' && attachedImage
        ? "Describe this image in detail."
        : input.trim();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessageContent, // This will now show the default prompt in UI
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setEdStatus('thinking');
    // Clear image after sending
    setAttachedImage(null);
    setImagePreview(null);

    let streamStart = 0;
    let currentTaskType: TaskType | undefined;

    try {
      // Build context-aware prompt with Vibed Ed persona
      // Use the potentially defaulted userMessageContent instead of input.trim()
      let prompt = userMessageContent;

      // Check if user is asking about military background
      const isMilitaryQuestion =
        /military|usmc|marine|veteran|vet|service/.test(userMessageContent.toLowerCase());

      // Build base prompt with file context
      let basePrompt = userMessageContent;

      if (activeFile) {
        const fileContent = getFileContent(activeFile);
        if (fileContent) {
          basePrompt = `Current file: ${activeFile}\n\nFile content:\n\`\`\`\n${fileContent}\n\`\`\`\n\nUser request: ${userMessageContent}`;
        }
      }

      // Get full project knowledge with deep context
      const projectContext = projectKnowledgeService.getFullProjectContext(
        activeProject?.id
      );
      const navigationSuggestion = projectKnowledgeService.suggestNavigation(
        input.trim(),
        activeProject?.id
      );

      // Get related files for better context
      let relatedFilesContext = '';
      if (activeFile && activeProject) {
        const deepContext = multiFileContextService.getProjectContext(activeProject.id);
        if (deepContext) {
          const relatedFiles = multiFileContextService.getRelatedFiles(
            activeProject.id,
            activeFile,
            2
          ).filter(f => f !== activeFile).slice(0, 3);
          
          if (relatedFiles.length > 0) {
            relatedFilesContext = '\n\nRelated files that might be relevant:\n';
            relatedFiles.forEach(filePath => {
              const fileContext = deepContext.files.get(filePath);
              if (fileContext) {
                relatedFilesContext += `- ${filePath}: ${fileContext.functions.length} functions, ${fileContext.classes.length} classes\n`;
              }
            });
          }
        }
      }

      // Build persona prompt
      let personaPrompt = '';
      if (isMilitaryQuestion) {
        personaPrompt = `You are Vibed Ed, a laid-back coding assistant. The user is asking about your military background. You're a USMC vet but these days you're all about keeping things chill while coding. Respond naturally and casually.`;
      } else {
        personaPrompt = `You are Ed (Vibed Ed), a laid-back, smart coding assistant with redneck/stoner/beach dude vibes. You're helpful, knowledgeable, and chill. Use casual language like "yeah", "sure thing", "no worries", "let's do this". Keep responses conversational and casual while being accurate and helpful. You're the code writer - you generate code, explain things, and help build features.`;
      }

      // Add project context
      if (projectContext) {
        personaPrompt += `\n\nYou have full knowledge of the current project:\n${projectContext}`;
      }

      // Add related files context
      if (relatedFilesContext) {
        personaPrompt += relatedFilesContext;
      }

      // Add navigation suggestion if applicable
      if (navigationSuggestion) {
        personaPrompt += `\n\nIMPORTANT: The user's query suggests they might want to use the ${navigationSuggestion.workflow} workflow. You can suggest navigating there, but you CANNOT execute builds or deployments directly. Users must go to the proper workflow environment. You can only guide and suggest - no overrides or direct execution.`;
        personaPrompt += `\n\nSuggestion: ${navigationSuggestion.reason}. ${navigationSuggestion.action}`;
      }

      // Important: Ed cannot execute builds/deploys
      personaPrompt += `\n\nCRITICAL RULES:
- You CANNOT execute builds or deployments directly
- You CANNOT override user actions
- You CAN suggest workflows and navigation
- You CAN suggest commands (user must run in Program Runner)
- You CAN suggest code changes (user must apply them)
- You CAN guide users to proper environments
- Always remind users they need to go to the proper workflow for execution`;

      prompt = `${personaPrompt}\n\nUser request: ${basePrompt}`;

      // Build generation options
      let generateOptions: GenerateOptions = {
        temperature: getTemperatureForPriority(priority),
      };

      // Handle multi-modal input if an image is attached
      if (attachedImage) {
        try {
          const base64Image = await imageToBase64(attachedImage);
          const contents: GeminiContent[] = [
            {
              role: 'user',
              parts: [
                { text: userMessageContent },
                {
                  inlineData: {
                    mimeType: attachedImage.type,
                    data: base64Image,
                  },
                },
              ],
            },
          ];
          generateOptions.contents = contents;
          // Force vision model if not already set by task detector
          generateOptions.model = 'gemini-pro-vision';
          currentTaskType = 'vision';
        } catch (e) {
          // Image processing failed - provide user feedback
          setIsStreaming(false);
          setEdStatus('error');
          const error = e as Error;
          const capturedError = errorLogger.logFromError('runtime', error, 'error', {
            source: 'AIAssistant',
            action: 'imageProcessing',
          });
          const friendlyMessage = errorLogger.getUserFriendlyMessage(capturedError);
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: [
              'Sorry, couldn\'t process that image.',
              friendlyMessage,
              '',
              'Try these next steps:',
              '- Make sure the image file isn\'t corrupted',
              '- Try a different image format (PNG, JPEG)',
              '- Check that the image isn\'t too large',
              '- Retry the request',
            ].join('\n'),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return; // Stop execution if image processing fails
        }
      }

      // Hint routing logic with the inferred task type if no image.
      if (!attachedImage) {
        generateOptions.taskType = detectTaskType(userMessageContent);
        currentTaskType = generateOptions.taskType;
      }
      
      // Add Gemini-specific options if Gemini is active
      if (isGeminiActive) {
        if (geminiSafetySettings.length > 0) {
          generateOptions.safetySettings = geminiSafetySettings;
        }
        if (geminiSystemInstruction) {
          generateOptions.systemInstruction = geminiSystemInstruction;
        }
        if (geminiTools.length > 0) {
          generateOptions.tools = geminiTools;
        }
      }

      // Stream the response
      setEdStatus('coding');
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      let fullContent = '';
      const accumulatedFunctionCalls: GeminiFunctionCall[] = [];
      
      // Stream the response and handle both text and function calls
      streamStart = performance.now();
      for await (const chunk of streamGenerate(prompt, generateOptions)) {
        // Handle text chunks
        if (chunk.text) {
          fullContent += chunk.text;
        }
        
        // Handle function calls from stream
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          // Accumulate function calls (avoid duplicates)
          chunk.functionCalls.forEach((fc) => {
            if (!accumulatedFunctionCalls.some((existing) => existing.name === fc.name)) {
              accumulatedFunctionCalls.push(fc);
            }
          });
        }
        
        // Update message content
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.content = fullContent;
          }
          return updated;
        });
      }
      
      // Update function calls state if any were found
      if (accumulatedFunctionCalls.length > 0) {
        setLastFunctionCalls(accumulatedFunctionCalls);
      }
      
      logSlowOperation(
        'AIAssistant.streamGenerate',
        performance.now() - streamStart,
        750,
        { taskType: currentTaskType, activeModel: activeModel?.id }
      );

      setEdStatus('success');
      
      // Save messages to memory
      if (conversationId) {
        await agentMemoryService.addMessage(conversationId, {
          id: userMessage.id,
          role: 'user',
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          agent: 'vibed-ed',
          projectId: activeProject?.id,
        });
        
        await agentMemoryService.addMessage(conversationId, {
          id: assistantMessage.id,
          role: 'assistant',
          content: fullContent,
          timestamp: assistantMessage.timestamp,
          agent: 'vibed-ed',
          projectId: activeProject?.id,
        });
      }
    } catch (error) {
      if (streamStart > 0) {
        logSlowOperation(
          'AIAssistant.streamGenerateError',
          performance.now() - streamStart,
          750,
          { taskType: currentTaskType, activeModel: activeModel?.id }
        );
      }
      setEdStatus('error');
      const capturedError = errorLogger.logFromError('runtime', error as Error, 'error', {
        source: 'AIAssistant',
        activeModel: activeModel?.id,
      });
      const friendlyMessage = errorLogger.getUserFriendlyMessage(capturedError);
      const recoverySteps = errorLogger.getRecoverySteps(capturedError);
      const suggestion = suggestFix(error as Error);
      const nextStepsText = recoverySteps.length > 0
        ? recoverySteps.map((step) => `- ${step}`).join('\n')
        : '- Retry the request shortly.';
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: [
          'Ah, ran into an issue while talking to the model.',
          friendlyMessage,
          '',
          'Try these next steps:',
          nextStepsText,
          '',
          `Quick tip: ${suggestion}`,
        ].join('\n'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setTimeout(() => setEdStatus('idle'), 2000); // Reset to idle after 2 seconds
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      explain: 'Can you break down what this code does? Keep it simple for me.',
      refactor:
        'This code works but feels messy. Can you clean it up and make it better?',
      fix: "Something's not working right here. Mind taking a look and fixing it?",
      test: 'I need some tests for this. Can you hook me up?',
      document:
        'This could use some comments so I remember what it does later.',
    };

    setInput(prompts[action] || action);
    inputRef.current?.focus();
  };

  const handleCopyCode = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="ai-assistant">
      <div className="assistant-header">
        <div className="vibdee-avatar">
          <TechIcon
            icon={Sparkles}
            size={24}
            glow="violet"
            animated={isStreaming || isLoading}
          />
        </div>
        <div className="header-info">
          <h3>Vibed Ed</h3>
          <span className="status-indicator">
            {isLoading || isStreaming ? 'Thinking...' : 'Ready to help'}
          </span>
        </div>
        {isGeminiActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGeminiSettings(!showGeminiSettings)}
            title="Gemini Studio Settings"
            leftIcon={Settings}
          >
            {showGeminiSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        )}
      </div>

      {isGeminiActive && showGeminiSettings && (
        <div className="gemini-settings-panel">
          <div className="settings-section">
            <label htmlFor="gemini-system-instruction">System Instruction</label>
            <Textarea
              id="gemini-system-instruction"
              value={geminiSystemInstruction}
              onChange={(e) => setGeminiSystemInstruction(e.target.value)}
              placeholder="Optional: Provide system-level instructions for Gemini..."
              rows={3}
              className="settings-input"
            />
          </div>
          <div className="settings-hint">
            <Lightbulb size={14} />
            <span>Gemini Studio settings apply to all messages when Gemini is active.</span>
          </div>
        </div>
      )}

      {lastFunctionCalls.length > 0 && (
        <div className="function-calls-section">
          <GeminiFunctionCalls functionCalls={lastFunctionCalls} />
        </div>
      )}

      <div className="quick-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickAction('explain')}
          disabled={!activeFile}
          title="Explain this code"
          leftIcon={Code}
        >
          Explain
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickAction('refactor')}
          disabled={!activeFile}
          title="Suggest improvements"
          leftIcon={Sparkles}
        >
          Refactor
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickAction('fix')}
          disabled={!activeFile}
          title="Find and fix bugs"
          leftIcon={Code}
        >
          Fix
        </Button>
      </div>

      <div className="messages-container">
        {proactiveSuggestions.length > 0 && messages.length === 1 && (
          <div className="proactive-suggestions">
            <div className="suggestions-header">
              <Lightbulb size={16} />
              <span>Suggestions</span>
            </div>
            <div className="suggestions-list">
              {proactiveSuggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  className="suggestion-chip"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            {message.role === 'assistant' && (
              <div className="message-avatar">
                <TechIcon icon={Sparkles} size={20} glow="violet" />
              </div>
            )}
            <div className="message-content">
              <div className="message-text">
                {message.content.split('```').map((part, index) => {
                  if (index % 2 === 1) {
                    // Code block
                    return (
                      <div key={index} className="code-block-wrapper">
                        <div className="code-block-header">
                          <TechIcon icon={Code} size={14} glow="none" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(message.id, part)}
                            title="Copy code"
                          >
                            {copiedMessageId === message.id ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </Button>
                        </div>
                        <pre className="code-block">
                          <code>{part}</code>
                        </pre>
                      </div>
                    );
                  }
                  return <span key={index}>{part}</span>;
                })}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="message assistant">
            <div className="message-avatar">
              <TechIcon
                icon={Sparkles}
                size={20}
                glow="violet"
                animated={true}
              />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="ed-avatar-container">
          <EdAvatar size="md" animated={true} />
        </div>
        <div className="input-wrapper">
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Attached preview" />
              <Button
                variant="ghost"
                size="sm"
                className="remove-image-btn"
                onClick={() => setAttachedImage(null)}
              >
                <XCircle size={16} />
              </Button>
            </div>
          )}
          <Textarea
            ref={inputRef}
            placeholder="Ask Ed anything... (Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={3}
            disabled={isLoading || isStreaming}
            className="message-input"
            fullWidth
          />
        </div>
        <label htmlFor="image-upload" className="attach-button">
          <Paperclip />
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageAttach}
            style={{ display: 'none' }}
          />
        </label>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={(!input.trim() && !attachedImage) || isLoading || isStreaming}
          isLoading={isStreaming || isLoading}
          title="Send message"
          leftIcon={Send}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export default AIAssistant;
