import React, { useState, useRef, useEffect } from 'react';
import VibedEdAvatar from './VibedEdAvatar';
import { useProjectStore } from '../services/project/projectStore';
import { luxrigAffiliate } from '../affiliate/luxrig';
import { revenueTracker } from '../revenue/tracker';
import '../styles-new/vibed-ed.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ed';
  timestamp: Date;
}

interface VibedEdChatProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

function VibedEdChat({ isMinimized, onToggleMinimize }: VibedEdChatProps) {
  const { activeProject, activeFile } = useProjectStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Howdy there! I'm Vibed Ed. Been waitin' to help ya with some code. What can I do ya for?",
      sender: 'ed',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, sender: 'user' | 'ed') => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    addMessage(userMessage, 'user');

    setIsTyping(true);

    // Simulate AI response with laid-back personality, context awareness, and revenue integration
    setTimeout(() => {
      let response = '';

      // GPU/AI Hardware recommendations
      if (userMessage.toLowerCase().includes('gpu') ||
          userMessage.toLowerCase().includes('hardware') ||
          userMessage.toLowerCase().includes('luxrig') ||
          userMessage.toLowerCase().includes('nvidia') ||
          userMessage.toLowerCase().includes('rtx')) {

        const recommendations = luxrigAffiliate.getAIRecommendations();
        if (recommendations.length > 0) {
          const topGPU = recommendations[0];
          const affiliateLink = luxrigAffiliate.generateAffiliateLink(topGPU.id);

          // Track the affiliate click
          if (affiliateLink) {
            revenueTracker.trackClick({
              affiliateId: 'luxrig',
              productId: topGPU.id,
              productName: topGPU.name,
              clickUrl: affiliateLink,
              userAgent: navigator.userAgent,
              sessionId: 'session_' + Date.now()
            });
          }

          response = `Ah, hardware talk! For AI development, I'd recommend the ${topGPU.name} (${topGPU.gpuModel}) with ${topGPU.vram} VRAM. It's got ${topGPU.specs.cudaCores} CUDA cores and runs about $${topGPU.price}. Perfect for trainin' models and runnin' complex AI workloads.

You can check it out on LuxRig here: ${affiliateLink || 'luxrig.com'}

Got a specific budget or use case in mind? I can recommend somethin' more tailored.`;
        } else {
          response = "Hardware recommendations, huh? I got some solid GPU suggestions for AI work. What kinda budget are ya workin' with, and what kinda AI projects ya runnin'?";
        }
      }
      // Context-aware development responses
      else if (activeProject && activeFile) {
        if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('what')) {
          response = `Workin' on ${activeFile} in your ${activeProject.name} project? I got the full context here. What specifically needs fixin'?`;
        } else if (userMessage.toLowerCase().includes('error') || userMessage.toLowerCase().includes('bug')) {
          response = `Bug in ${activeFile}? I see what you're workin' with. Let me take a look at that code pattern... yeah, I think I can help ya sort this out.`;
        } else if (userMessage.toLowerCase().includes('refactor')) {
          response = `Refactorin' ${activeFile}, huh? I've got the whole project structure in mind. This looks like a good candidate for some cleanin' up.`;
        } else if (userMessage.toLowerCase().includes('performance') || userMessage.toLowerCase().includes('slow')) {
          response = `Performance issues? That can be a real drag. If you're runnin' heavy AI workloads, you might want to check out some GPU upgrades. I can recommend some solid options from LuxRig that would speed things up considerably.`;
        }
      } else if (activeProject) {
        response = `Got your ${activeProject.name} project loaded. What file are ya workin' on, or need help with? If you're doin' any AI/ML work, I can also recommend some hardware upgrades.`;
      } else {
        // General responses
        if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
          response = "Howdy there! I'm Vibed Ed. Been waitin' to help ya with some code. What can I do ya for?";
        } else if (userMessage.toLowerCase().includes('help')) {
          response = "Yeah, I got ya covered. Just tell me what you're workin' on - refactorin', debuggin', or maybe you need some ideas for that project.";
        } else if (userMessage.toLowerCase().includes('code')) {
          response = "Code, huh? That's my specialty. Been writin' and readin' code for longer than I can remember. What's the trouble?";
        } else if (userMessage.toLowerCase().includes('ai') || userMessage.toLowerCase().includes('machine learning')) {
          response = "AI and ML, huh? That's right up my alley. I can help ya with code, architecture, and even recommend some hardware if you're lookin' to speed things up. What kinda AI project ya workin' on?";
        } else {
          response = "Hmm, that's interestin'. Let me think on that for a second... Yeah, I reckon we can work somethin' out. What exactly are ya tryin' to accomplish?";
        }
      }

      addMessage(response, 'ed');
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay for realism
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <div className="vibed-ed-minimized" onClick={onToggleMinimize}>
        <VibedEdAvatar size="small" animated />
        <div className="minimized-indicator">
          {messages.filter(m => m.sender === 'user' && !m.timestamp).length > 0 && (
            <span className="notification-dot"></span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="vibed-ed-chat">
      <div className="chat-header">
        <VibedEdAvatar size="small" />
        <div className="chat-title">
          <span className="name">Vibed Ed</span>
          <span className="status">Online</span>
        </div>
        <button className="minimize-button" onClick={onToggleMinimize}>
          ―
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === 'ed' ? 'ed-message' : 'user-message'}`}
          >
            {message.sender === 'ed' && <VibedEdAvatar size="tiny" />}
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message ed-message">
            <VibedEdAvatar size="tiny" />
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

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask Ed anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="send-button"
        >
          {isTyping ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

export default VibedEdChat;
