// src/components/MissionControl/MissionControl.tsx
import { useState, useMemo } from 'react';
import { useAgentStore } from '../../services/agent/agentStore';
import { missionPlanner, MissionPlan } from '../../services/agent/missionPlanner';
import TechIcon from '../Icons/TechIcon';
import '../../styles/MissionControl.css';
import { shallow } from 'zustand/shallow';
import { Agent } from '../../types/agent';

const MissionControl = () => {
  const agents = useAgentStore((state) => Object.values(state.agents), shallow) as Agent[];
  const [objective, setObjective] = useState('');
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);

  const agentMap = useMemo(() => new Map(agents.map((agent: Agent) => [agent.id, agent])), [agents]);

  const handleLaunchMission = async () => {
    if (!objective.trim()) return;
    setIsLoading(true);
    setPlan(null);
    setMissionError(null); // Clear previous errors
    try {
      const missionPlan = await missionPlanner.createPlan(objective);
      setPlan(missionPlan);
    } catch (error) {
      console.error("Error creating mission plan:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMissionError(`Failed to generate mission plan: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mission-control">
      <div className="mc-header">
        <h1>Mission Control</h1>
        <p>Coordinate AI agents to automate complex development workflows.</p>
      </div>
      <div className="mc-main-grid">
        <div className="mc-agents-panel">
          <h2>Available Agents</h2>
          <div className="agents-list">
            {agents.map((agent) => (
              <div key={agent.id} className={`agent-card status-${agent.status}`}>
                <div className="agent-card-header">
                  <TechIcon icon={agent.icon} />
                  <h3>{agent.name}</h3>
                </div>
                <p>{agent.description}</p>
                <div className="agent-status-indicator">
                  Status: <span>{agent.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mc-mission-panel">
          <h2>Mission Briefing</h2>
          <textarea
            className="mission-input"
            placeholder="Describe your objective... (e.g., 'Refactor the state management to use Zustand and then deploy to Vercel')"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            disabled={isLoading}
          />
          <button className="launch-mission-btn" onClick={handleLaunchMission} disabled={isLoading}>
            {isLoading ? 'Planning...' : 'Generate Mission Plan'}
          </button>
        </div>
        <div className="mc-logs-panel">
          <h2>Mission Logs</h2>
          <div className="logs-output">
            {!plan && !isLoading && !missionError && <p>Awaiting mission briefing...</p>}
            {isLoading && <p>Analyzing objective and generating mission plan...</p>}
            {missionError && <p className="mission-error">{missionError}</p>}
            {plan && (
              <div>
                <h4>Objective: {plan.objective}</h4>
                <ul>
                  {plan.steps.map((step, index) => {
                    const agent = agentMap.get(step.agentId);
                    return (
                      <li key={index} className="mission-step">
                        <div className="agent-info">
                          {agent ? (
                            <TechIcon icon={agent.icon} size="sm" />
                          ) : (
                            <div className="agent-placeholder-icon" />
                          )}
                          <strong>{agent ? agent.name : step.agentId}</strong>
                        </div>
                        <span className="task-description">{step.task}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
