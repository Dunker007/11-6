// src/components/MissionControl/MissionControl.tsx
import { useState, useMemo, useEffect } from 'react';
import { useAgentStore } from '../../services/agent/agentStore';
import { missionPlanner } from '../../services/agent/missionPlanner';
import { missionEngine } from '../../services/mission/missionEngine';
import { MissionRun, MissionStepStatus } from '../../services/mission/missionTypes';
import { useMissionStore } from '../../services/mission/missionStore';
import { missionEventBus } from '../../services/mission/missionEventBus';
import TechIcon from '../Icons/TechIcon';
import '../../styles/MissionControl.css';
import { Agent } from '../../types/agent';

const MissionControl = () => {
  // Get agents record directly and convert to array with useMemo to prevent infinite loops
  const agentsRecord = useAgentStore((state) => state.agents);
  const agents = useMemo(() => Object.values(agentsRecord) as Agent[], [agentsRecord]);
  const [objective, setObjective] = useState('');
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);

  const agentMap = useMemo(() => new Map(agents.map((agent: Agent) => [agent.id, agent])), [agents]);
  const missions = useMissionStore((state) => state.missions);
  const missionOrder = useMissionStore((state) => state.missionOrder);
  const activeMission: MissionRun | undefined = activeMissionId
    ? missions[activeMissionId]
    : missionOrder.length > 0
      ? missions[missionOrder[0]]
      : undefined;

  const handleLaunchMission = async () => {
    if (!objective.trim()) return;
    setIsPlanning(true);
    setMissionError(null); // Clear previous errors
    try {
      const missionDefinition = await missionPlanner.createPlan(objective);
      const missionId = await missionEngine.runMission(missionDefinition);
      setActiveMissionId(missionId);
      setObjective('');
    } catch (error) {
      console.error("Error creating mission plan:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setMissionError(`Failed to generate mission plan: ${errorMessage}`);
    } finally {
      setIsPlanning(false);
    }
  };

  useEffect(() => {
    if (activeMission) return;
    if (missionOrder.length > 0) {
      setActiveMissionId(missionOrder[0]);
    }
  }, [missionOrder, activeMission]);

  useEffect(() => {
    const unsubscribe = missionEventBus.subscribe((event) => {
      if (event.type === 'mission:status-changed' && event.payload.status === 'completed' && activeMissionId === event.missionId) {
        // Trigger re-render, store already updated via zustand
      }
    });
    return () => unsubscribe();
  }, [activeMissionId]);

  const renderStepStatus = (status: MissionStepStatus) => {
    const map: Record<MissionStepStatus, string> = {
      pending: 'Pending',
      running: 'Running',
      'waiting-human': 'Waiting',
      completed: 'Completed',
      failed: 'Failed',
      skipped: 'Skipped',
    };
    return map[status];
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
                {agent.capabilities && agent.capabilities.length > 0 && (
                  <ul className="agent-capabilities">
                    {agent.capabilities.map((capability) => (
                      <li key={capability.id}>{capability.name}</li>
                    ))}
                  </ul>
                )}
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
            disabled={isPlanning}
          />
          <button className="launch-mission-btn" onClick={handleLaunchMission} disabled={isPlanning}>
            {isPlanning ? 'Planning...' : 'Launch Mission'}
          </button>
          {missionOrder.length > 0 && (
            <div className="mission-history">
              <h3>Active Missions</h3>
              <ul>
                {missionOrder.map((missionId) => {
                  const mission = missions[missionId];
                  if (!mission) return null;
                  return (
                    <li
                      key={missionId}
                      className={missionId === activeMissionId ? 'active' : ''}
                      onClick={() => setActiveMissionId(missionId)}
                    >
                      <span className={`status-dot status-${mission.status}`} />
                      <span className="mission-title">{mission.definition.objective}</span>
                      <span className="mission-progress">{mission.progress}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="mc-logs-panel">
          <h2>Mission Timeline</h2>
          <div className="logs-output">
            {!activeMission && !isPlanning && !missionError && <p>Awaiting mission briefing...</p>}
            {isPlanning && <p>Analyzing objective and generating mission plan...</p>}
            {missionError && <p className="mission-error">{missionError}</p>}
            {activeMission && (
              <div className="mission-detail">
                <div className="mission-detail-header">
                  <h4>Objective: {activeMission.definition.objective}</h4>
                  <span className={`status-pill status-${activeMission.status}`}>{activeMission.status}</span>
                  <span className="mission-progress">{activeMission.progress}%</span>
                </div>
                <div className="mission-phases">
                  {activeMission.phases.map((phase) => (
                    <div key={phase.id} className="mission-phase">
                      <div className="mission-phase-header">
                        <h5>{phase.definition.name}</h5>
                        <span className={`status-pill status-${phase.status}`}>{phase.status}</span>
                      </div>
                      <ul>
                        {phase.steps.map((step) => {
                          const agent = agentMap.get(step.definition.agentId);
                          return (
                            <li key={step.id} className={`mission-step status-${step.status}`}>
                              <div className="agent-info">
                                {agent ? <TechIcon icon={agent.icon} size="sm" /> : <div className="agent-placeholder-icon" />}
                                <strong>{agent ? agent.name : step.definition.agentId}</strong>
                              </div>
                              <div className="step-meta">
                                <span className="task-description">{step.definition.description ?? step.definition.action}</span>
                                <span className="step-status">{renderStepStatus(step.status)}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mission-log-section">
                  <h5>Recent Activity</h5>
                  <ul>
                    {activeMission.logs.length === 0 && <li>No activity yet.</li>}
                    {activeMission.logs.map((log) => (
                      <li key={log.id}>
                        <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className={`log-level level-${log.level}`}>{log.level.toUpperCase()}</span>
                        <span>{log.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionControl;
