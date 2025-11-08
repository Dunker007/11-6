// src/components/RightPanel/KaiCreativeRoom.tsx
import React, { useState } from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import '../../styles/RightPanel.css';
import { Send } from 'lucide-react';
import type { Project } from '../../types/project';

interface Message {
  sender: 'user' | 'kai';
  text: string;
  idea?: { title: string; };
}

const KaiCreativeRoom = () => {
  const { createProject } = useProjectStore();
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'kai', text: "What's the vibe today? Any new passive income streams on your mind?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Mock Kai's response
    setTimeout(() => {
      const kaiResponse: Message = { 
        sender: 'kai', 
        text: "That's a cool thought. What if we built an 'Auto-Affiliate' workflow around that?",
        idea: { title: 'Auto-Affiliate Site' }
      };
      setMessages(prev => [...prev, kaiResponse]);
    }, 1000);
  };

  const handlePromoteToBacklog = (ideaTitle: string) => {
    createProject(ideaTitle);
    const confirmationMessage: Message = {
      sender: 'kai',
      text: `Awesome! I've added "${ideaTitle}" to the idea backlog. We can flesh it out later.`
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  return (
    <div className="kai-creative-room">
      <div className="widget-header">
        <TechIcon icon={ICON_MAP.vibedEd} />
        <h4>Kai Creative Room</h4>
      </div>
      <div className="kai-chat-area">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender}`}>
            <p>{msg.text}</p>
            {msg.idea && (
              <div className="idea-card">
                <h5>New Idea</h5>
                <p>{msg.idea.title}</p>
                <button 
                  className="promote-button"
                  onClick={() => handlePromoteToBacklog(msg.idea!.title)}
                >
                  Promote to Backlog
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="kai-chat-input-area">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Vibe with Kai..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}><Send size={16} /></button>
      </div>
    </div>
  );
};

export default KaiCreativeRoom;
