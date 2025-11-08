import React, { useState } from 'react';
import '../../styles/VibeBar.css';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { Plan } from '../../../electron/ai/workflowEngine';
import { aiServiceBridge } from '../../services/ai/aiServiceBridge';

const VibeBar = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setPlan(null);
    try {
      const response = await aiServiceBridge.createPlan(inputValue);
      if (response.success && response.plan) {
        setPlan(response.plan);
      } else {
        console.error('Error creating plan:', response.error);
        // Display error to the user
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      // You could also set an error state here to display to the user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vibe-bar-container">
      <div className="vibe-bar-wrapper">
        <form onSubmit={handleSubmit} className="vibe-bar-form">
          <TechIcon icon={ICON_MAP.vibedEd} size={20} className="vibe-bar-icon" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe a task or refactoring..."
            className="vibe-bar-input"
            disabled={isLoading}
          />
          <button type="submit" className="vibe-bar-submit" disabled={isLoading}>
            {isLoading ? 'Thinking...' : 'Generate Plan'}
          </button>
        </form>
      </div>
      {plan && (
        <div className="plan-display">
          <h3>Generated Plan:</h3>
          <ul>
            {plan.steps.map((step, index) => (
              <li key={index}>
                <strong>{step.type}:</strong> 
                {step.thought || step.filePath || step.command}
                {step.content && ` - ${step.content}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VibeBar;
